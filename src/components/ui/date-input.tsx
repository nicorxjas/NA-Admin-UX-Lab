import { CalendarIcon, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DateInputProps = {
  id: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  triggerBaseClassName?: string;
  triggerClassName?: string;
  iconClassName?: string;
  popoverClassName?: string;
  calendarClassName?: string;
  clearLabel?: string;
};

function parseDateValue(value: string) {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DateInput({
  id,
  value,
  placeholder,
  onChange,
  triggerBaseClassName = "linear-field-trigger",
  triggerClassName,
  iconClassName,
  popoverClassName,
  calendarClassName,
  clearLabel = "Limpiar fecha",
}: DateInputProps) {
  const selected = parseDateValue(value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button id={id} type="button" className={cn(triggerBaseClassName, triggerClassName)}>
          <span className={value ? "linear-field-value" : "linear-field-value-muted"}>
            {value || placeholder || "Seleccionar fecha"}
          </span>
          <CalendarIcon className={cn("linear-field-icon", iconClassName)} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className={cn("linear-date-popover", popoverClassName)}>
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => onChange(date ? formatDateValue(date) : "")}
          className={cn("linear-calendar-surface", calendarClassName)}
        />
        {value && (
          <div className="linear-date-actions">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="linear-date-clear-button"
              onClick={() => onChange("")}
            >
              <X className="linear-picker-clear-icon" />
              {clearLabel}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
