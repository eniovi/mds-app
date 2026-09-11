"use client";

import { useEffect } from "react";

/** Keyboard dismissal for form dialogs. Escape closes the dialog only while
 * it holds no unsaved input — once the user has typed anything, the only ways
 * out are the explicit Cancel / close buttons or finishing the form, so a
 * stray key can't throw work away. Backdrop clicks are deliberately not
 * handled here (or anywhere): form dialogs no longer close on them at all. */
export function useDialogDismiss(onClose: () => void, dirty: boolean): void {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !dirty) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, dirty]);
}
