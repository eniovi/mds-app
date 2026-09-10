"use client";

import { useEffect, useRef } from "react";

interface IndeterminateCheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

/** Native checkbox styled via the .ds-checkbox class (accent-color: var(--brand),
 * focus-visible ring matching every other input's focus treatment) — reusing
 * the platform control instead of hand-building one keeps keyboard/screen-reader
 * behavior correct for free. `indeterminate` can only be set imperatively on
 * the DOM node, hence the ref. */
export function IndeterminateCheckbox({ checked, indeterminate = false, onChange, label }: IndeterminateCheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      className="ds-checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      aria-label={label}
    />
  );
}
