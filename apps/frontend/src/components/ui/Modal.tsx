"use client";

import { useEffect, type FormEvent, type ReactNode } from "react";
import { Button } from "./Button";
import { Icon } from "./Icon";

interface ModalProps {
  title: string;
  description: string;
  submitLabel: string;
  error: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
}

export function Modal({ title, description, submitLabel, error, isSubmitting, onClose, onSubmit, children }: ModalProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section aria-labelledby="modal-title" aria-modal="true" className="modal-panel" role="dialog">
        <button aria-label="Close dialog" className="icon-button modal-close" onClick={onClose} type="button"><Icon name="close" /></button>
        <div className="modal-heading-icon"><Icon name="wallet" /></div>
        <h2 id="modal-title">{title}</h2>
        <p className="modal-description">{description}</p>
        <form onSubmit={onSubmit}>
          {children}
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions">
            <Button disabled={isSubmitting} onClick={onClose} type="button" variant="secondary">Cancel</Button>
            <Button disabled={isSubmitting} type="submit">{isSubmitting ? "Working…" : submitLabel}</Button>
          </div>
        </form>
      </section>
    </div>
  );
}
