import type { ComponentType } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function StepItem({
  step,
  activeStep,
  showLine,
  onSelect,
  disabled,
}: {
  step: {
    number: number;
    label: string;
    title: string;
    icon: ComponentType<{ className?: string }>;
  };
  activeStep: number;
  showLine: boolean;
  onSelect?: () => void;
  disabled?: boolean;
}) {
  const Icon = step.icon;
  const isComplete = step.number < activeStep;
  const isCurrent = step.number === activeStep;

  const Content = onSelect ? "button" : "div";

  return (
    <li
      aria-current={isCurrent ? "step" : undefined}
      className="flex min-w-[176px] flex-1 items-center"
    >
      {step.number > 1 ? <span className="mr-4 h-px min-w-8 flex-1 bg-border/80" /> : null}
      <Content
        className="flex min-w-0 shrink-0 items-center gap-3 text-left"
        {...(onSelect ? { type: "button" as const, onClick: onSelect, disabled } : {})}
      >
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[13px] font-semibold",
            isCurrent
              ? "border-[#5E6AD2] bg-[#5E6AD2] text-white shadow-[0_0_0_4px_rgba(94,106,210,0.16)]"
              : isComplete
                ? "border-[#5E6AD2]/60 bg-[#5E6AD2]/15 text-[#A8B1FF]"
                : "border-border bg-background/55 text-muted-foreground",
          )}
        >
          {isComplete ? <Check className="h-4 w-4" /> : step.number}
        </span>
        <div className="min-w-0">
          <div
            className={cn(
              "flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em]",
              isCurrent || isComplete ? "text-[#A8B1FF]" : "text-muted-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {step.label}
          </div>
          <div className="mt-0.5 truncate text-[13.5px] font-medium text-foreground">
            {step.title}
          </div>
        </div>
      </Content>
      {showLine && <span className="ml-4 h-px min-w-8 flex-1 bg-border/80" />}
    </li>
  );
}
