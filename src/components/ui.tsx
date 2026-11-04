"use client";

import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";

/** Modal sheet built on <dialog>: bottom sheet on phones, centred panel on desktop. */
export function Sheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="sheet"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {open ? (
        <div className="sheet-body">
          <header className="sheet-head">
            <h2>{title}</h2>
            <button
              type="button"
              className="icon-btn"
              onClick={onClose}
              aria-label="Close"
            >
              <Icon name="x" />
            </button>
          </header>
          {children}
        </div>
      ) : null}
    </dialog>
  );
}

/** Form wrapper that shows a server error and disables while saving. */
export function SheetForm({
  onSubmit,
  submitLabel,
  onDelete,
  children,
}: {
  onSubmit: (form: FormData) => Promise<string | null>;
  submitLabel: string;
  onDelete?: () => Promise<string | null>;
  children: ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handle(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const err = await onSubmit(new FormData(e.currentTarget));
    setBusy(false);
    if (err) setError(err);
  }

  return (
    <form className="sheet-form" onSubmit={handle}>
      {children}
      {error ? <p className="form-error">{error}</p> : null}
      <div className="sheet-actions">
        {onDelete ? (
          <button
            type="button"
            className="btn btn-danger"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const err = await onDelete();
              setBusy(false);
              if (err) setError(err);
            }}
          >
            Delete
          </button>
        ) : null}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

export function Field({
  label,
  hint,
  children,
  wide,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={wide ? "field wide" : "field"}>
      <span className="field-label">{label}</span>
      {children}
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

export function MoneyInput({
  name,
  defaultValue,
  required = true,
  autoFocus,
}: {
  name: string;
  defaultValue?: number;
  required?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <span className="money-input">
      <span aria-hidden>£</span>
      <input
        name={name}
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0"
        required={required}
        autoFocus={autoFocus}
        defaultValue={defaultValue ?? ""}
      />
    </span>
  );
}

export function Meter({
  value,
  max,
  tone = "berry",
  marker,
  label,
}: {
  value: number;
  max: number;
  tone?: "berry" | "leaf" | "warn";
  /** 0–1 position of a "where you should be by now" tick. */
  marker?: number;
  label: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div
      className={`meter tone-${tone}`}
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <span className="meter-fill" style={{ width: `${pct}%` }} />
      {marker !== undefined ? (
        <span
          className="meter-mark"
          style={{ left: `${Math.min(100, marker * 100)}%` }}
        />
      ) : null}
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <header className="panel-head">
        <h3>{title}</h3>
        {action}
      </header>
      {children}
    </section>
  );
}

export function AddButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className="add-btn"
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      <Icon name="plus" />
    </button>
  );
}

export function Empty({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <p>{children}</p>
      {action}
    </div>
  );
}

const PATHS: Record<string, string> = {
  plus: "M12 5v14M5 12h14",
  x: "M6 6l12 12M18 6L6 18",
  left: "M15 6l-6 6 6 6",
  right: "M9 6l6 6-6 6",
  repeat:
    "M17 2l4 4-4 4M3 11V9a3 3 0 013-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 01-3 3H3",
  check: "M5 12.5l4.5 4.5L19 7",
  link: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5",
  pencil: "M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4",
  logout: "M15 4h4a1 1 0 011 1v14a1 1 0 01-1 1h-4M10 16l-4-4 4-4M6 12h10",
  coins:
    "M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6",
  list: "M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01",
};

export function Icon({
  name,
  size = 18,
}: {
  name: keyof typeof PATHS | string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
