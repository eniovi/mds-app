"use client";

import type { FieldValue, TaskField, Ticket } from "@/lib/types";
import { Combobox } from "./Combobox";
import { YesNo } from "./YesNo";
import { FilePickerField } from "./FilePickerField";
import { RevisionSelect } from "./RevisionSelect";
import { TabsField } from "./TabsField";
import { AsyncCatalogField } from "./AsyncCatalogField";
import { useLanguage } from "@/lib/useLanguage";
import { fieldLabel, fieldHint, fieldPlaceholder, optionLabel } from "@/lib/task-catalog-i18n";

interface FieldRowProps {
  taskId: string;
  field: TaskField;
  value: FieldValue | undefined;
  scopeValue: string | undefined;
  onChange: (value: FieldValue) => void;
  touched: boolean;
  activeTicket: Ticket | null;
}

export function FieldRow({ taskId, field, value, scopeValue, onChange, touched, activeTicket }: FieldRowProps) {
  const { t } = useLanguage();
  const isEmpty = field.multiple ? !(Array.isArray(value) && value.length) : !value;
  const invalid = touched && !!field.required && isEmpty;
  const textValue = typeof value === "string" ? value : "";

  return (
    <div className="field" data-od-id={"field-row-" + field.id}>
      <label className="label" htmlFor={field.id}>
        {fieldLabel(taskId, field, t)}
        {field.required && <span className="req-star">*</span>}
      </label>

      {field.type === "context-ticket" && (
        <div className="ticket-inline">
          <span>🎫 {activeTicket ? `${activeTicket.id} — ${activeTicket.title}` : t("common.loading")}</span>
          <a href="/tickets">{t("topbar.switchTicket")}</a>
        </div>
      )}
      {field.type === "text" && (
        <input
          id={field.id}
          className={"input" + (invalid ? " invalid" : "")}
          placeholder={fieldPlaceholder(taskId, field, t) || ""}
          value={textValue}
          onChange={(e) => onChange(e.target.value)}
          data-od-id={"field-" + field.id}
        />
      )}
      {field.type === "select" && (
        <select
          id={field.id}
          className="select"
          value={textValue}
          onChange={(e) => onChange(e.target.value)}
          data-od-id={"field-" + field.id}
        >
          {(field.options || []).map((o) => (
            <option key={o.value} value={o.value}>{optionLabel(taskId, field.id, o, t)}</option>
          ))}
        </select>
      )}
      {field.type === "yesno" && <YesNo taskId={taskId} field={field} value={textValue} onChange={onChange} />}
      {field.type === "catalog" && (
        <Combobox field={field} value={value} scopeValue={scopeValue} onChange={onChange} invalid={invalid} activeTicket={activeTicket} />
      )}
      {field.type === "file" && (
        <FilePickerField field={field} value={value} onChange={onChange} activeTicket={activeTicket} invalid={invalid} />
      )}
      {field.type === "revision" && (
        <RevisionSelect field={field} value={textValue} scopeValue={scopeValue} onChange={onChange} />
      )}
      {field.type === "tabs" && <TabsField taskId={taskId} field={field} value={textValue} onChange={onChange} />}
      {field.type === "async-catalog" && (
        <AsyncCatalogField field={field} value={value} scopeValue={scopeValue} onChange={onChange} invalid={invalid} />
      )}

      {fieldHint(taskId, field, t) && <span className="field-hint">{fieldHint(taskId, field, t)}</span>}
      {invalid && <span className="field-error">{t("fields.requiredField")}</span>}
    </div>
  );
}
