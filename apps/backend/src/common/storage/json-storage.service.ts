import { Injectable, InternalServerErrorException, Logger, type OnModuleInit } from "@nestjs/common";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

@Injectable()
export class JsonStorageService implements OnModuleInit {
  private readonly logger = new Logger(JsonStorageService.name);
  private readonly dataDirectory = join(process.cwd(), "data");
  private readonly journalPath = join(this.dataDirectory, "transaction-journal.json");

  async onModuleInit(): Promise<void> {
    await this.recover();
  }

  async ensureFile<T>(filename: string, initialValue: T): Promise<void> {
    const path = this.pathFor(filename);
    await mkdir(dirname(path), { recursive: true });
    try {
      await readFile(path, "utf8");
    } catch (error) {
      if (this.isNodeError(error) && error.code === "ENOENT") {
        await this.write(filename, initialValue);
        return;
      }
      throw this.storageError("read", filename, error);
    }
  }

  async read<T>(filename: string): Promise<T> {
    try {
      return JSON.parse(await readFile(this.pathFor(filename), "utf8")) as T;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new InternalServerErrorException(`Stored file ${filename} contains invalid JSON.`);
      }
      throw this.storageError("read", filename, error);
    }
  }

  async write<T>(filename: string, value: T): Promise<void> {
    const path = this.pathFor(filename);
    const temporaryPath = `${path}.${process.pid}.${Date.now()}.tmp`;
    try {
      await mkdir(dirname(path), { recursive: true });
      await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
      await rename(temporaryPath, path);
    } catch (error) {
      throw this.storageError("write", filename, error);
    }
  }

  async commit(files: Record<string, unknown>): Promise<void> {
    await this.recover();
    const previous: Record<string, string> = {};
    const staged: Array<{ filename: string; temporaryPath: string }> = [];
    for (const filename of Object.keys(files)) {
      previous[filename] = await readFile(this.pathFor(filename), "utf8");
    }

    const journal = { status: "prepared" as "prepared" | "committed", previous, createdAt: new Date().toISOString() };
    let journalWritten = false;
    try {
      await this.writeJournal(journal);
      journalWritten = true;

      for (const [filename, content] of Object.entries(files)) {
        const serialized = `${JSON.stringify(content, null, 2)}\n`;
        const temporaryPath = `${this.pathFor(filename)}.${process.pid}.${randomSuffix()}.tmp`;
        await writeFile(temporaryPath, serialized, { encoding: "utf8", flag: "wx" });
        JSON.parse(await readFile(temporaryPath, "utf8"));
        staged.push({ filename, temporaryPath });
      }

      for (const { filename, temporaryPath } of staged) {
        await this.replaceFile(temporaryPath, this.pathFor(filename));
      }

      journal.status = "committed";
      await this.writeJournal(journal);
      await rm(this.journalPath, { force: true }).catch((error: unknown) => {
        this.logger.warn(`Committed wallet transaction; journal cleanup will retry on startup: ${String(error)}`);
      });
    } catch (error) {
      await Promise.all(staged.map(({ temporaryPath }) => rm(temporaryPath, { force: true }).catch(() => undefined)));
      if (journalWritten) {
        try {
          await this.recover();
        } catch (recoveryError) {
          this.logger.error("Transaction recovery failed; the journal will be retried on startup.", recoveryError instanceof Error ? recoveryError.stack : undefined);
        }
      }
      throw this.storageError("commit wallet transaction", Object.keys(files).join(" and "), error);
    }
  }

  async recover(): Promise<void> {
    let rawJournal: string;
    try {
      rawJournal = await readFile(this.journalPath, "utf8");
    } catch (error) {
      if (this.isNodeError(error) && error.code === "ENOENT") return;
      throw this.storageError("read transaction journal", "transaction journal", error);
    }

    let journal: { status: "prepared" | "committed"; previous: Record<string, string> };
    try {
      journal = JSON.parse(rawJournal) as typeof journal;
      if (!journal || !["prepared", "committed"].includes(journal.status) || typeof journal.previous !== "object") throw new Error("Invalid transaction journal");
    } catch (error) {
      this.logger.error("Transaction journal is invalid; manual recovery is required.", error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException("Wallet transaction recovery data is invalid.");
    }

    if (journal.status === "prepared") {
      for (const [filename, content] of Object.entries(journal.previous)) {
        JSON.parse(content);
        const temporaryPath = `${this.pathFor(filename)}.${process.pid}.${randomSuffix()}.recovery.tmp`;
        await writeFile(temporaryPath, content, { encoding: "utf8", flag: "wx" });
        await this.replaceFile(temporaryPath, this.pathFor(filename));
      }
      this.logger.warn("Recovered an interrupted wallet transaction by restoring its previous files.");
    }
    await rm(this.journalPath, { force: true });
  }

  protected async replaceFile(source: string, destination: string): Promise<void> {
    await rename(source, destination);
  }

  private async writeJournal(journal: { status: "prepared" | "committed"; previous: Record<string, string>; createdAt: string }): Promise<void> {
    const temporaryPath = `${this.journalPath}.${process.pid}.${randomSuffix()}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(journal, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
    await this.replaceFile(temporaryPath, this.journalPath);
  }

  private pathFor(filename: string): string {
    return join(this.dataDirectory, filename);
  }

  private storageError(operation: string, filename: string, error: unknown): InternalServerErrorException {
    this.logger.error(`Unable to ${operation} ${filename}.`, error instanceof Error ? error.stack : undefined);
    return new InternalServerErrorException(`Unable to ${operation} wallet data. Please try again.`);
  }

  private isNodeError(error: unknown): error is NodeJS.ErrnoException {
    return error instanceof Error && "code" in error;
  }
}

function randomSuffix(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
