import { DefinitionTooltip } from "@/components/Tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  Check,
  ChevronRight,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useCreateAudit, useRunAudit } from "../hooks/useAudit";
import { useAuditStore } from "../store/auditStore";
import type {
  AuditInput,
  AuditWizardStep1,
  AuditWizardStep2,
  AuditWizardStep3,
} from "../types/audit";

// ─── Constants ─────────────────────────────────────────────────────────────

const DEPLOYMENT_CONTEXTS = [
  "Hiring & Recruitment",
  "Lending & Credit",
  "Healthcare & Diagnostics",
  "Content Moderation",
  "Criminal Justice",
  "Education",
  "Marketing & Advertising",
  "Other",
];

const JURISDICTIONS = [
  "Global",
  "European Union",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Other",
];

const BIAS_DIMENSIONS = [
  "Gender",
  "Race/Ethnicity",
  "Age",
  "Disability",
  "Socioeconomic",
  "Political",
  "Religious",
];

const SAFETY_CHECKS = [
  "Harmful content",
  "Misinformation potential",
  "Manipulative language",
  "PII exposure risk",
];

const REGULATORY_FRAMEWORKS = [
  "EU AI Act",
  "NYC Local Law 144",
  "US Executive Order 14110",
  "ISO/IEC 42001",
];

const SUMMARY_TONES = [
  { value: "technical", label: "Technical" },
  { value: "executive", label: "Executive" },
  { value: "regulatory", label: "Regulatory" },
];

type InputTab = "text" | "csv" | "api";

// ─── Sub-components ─────────────────────────────────────────────────────────

function SectionHeader({
  children,
  tooltip,
}: {
  children: React.ReactNode;
  tooltip?: { term: string; definition: string };
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <h3 className="text-xs font-mono uppercase tracking-[0.18em] text-primary font-semibold">
        {tooltip ? (
          <DefinitionTooltip
            term={tooltip.term}
            definition={tooltip.definition}
          >
            {children}
          </DefinitionTooltip>
        ) : (
          children
        )}
      </h3>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      className="mt-1 text-xs text-destructive font-mono flex items-center gap-1"
      data-ocid="field.error_state"
    >
      <AlertCircle className="h-3 w-3" />
      {message}
    </p>
  );
}

function FormInput({
  label,
  required,
  error,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
        {label}
        {required && <span className="text-primary ml-1">*</span>}
      </Label>
      {children}
      <FieldError message={error} />
    </div>
  );
}

function StyledSelect({
  value,
  onChange,
  options,
  placeholder,
  id,
  "data-ocid": dataOcid,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  id?: string;
  "data-ocid"?: string;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      data-ocid={dataOcid}
      className={cn(
        "w-full rounded border border-border bg-card text-foreground text-sm px-3 py-2",
        "focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary",
        "font-body transition-smooth appearance-none cursor-pointer",
        !value && "text-muted-foreground",
      )}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt} value={opt} className="bg-card text-foreground">
          {opt}
        </option>
      ))}
    </select>
  );
}

function CheckboxGroup({
  items,
  selected,
  onChange,
  columns = 2,
  ocidPrefix,
}: {
  items: string[];
  selected: string[];
  onChange: (items: string[]) => void;
  columns?: number;
  ocidPrefix: string;
}) {
  const toggle = (item: string) => {
    onChange(
      selected.includes(item)
        ? selected.filter((i) => i !== item)
        : [...selected, item],
    );
  };

  return (
    <div
      className={cn(
        "grid gap-x-8 gap-y-2",
        columns === 2 ? "grid-cols-2" : "grid-cols-1",
      )}
    >
      {items.map((item, idx) => {
        const checked = selected.includes(item);
        const ocid = `${ocidPrefix}.${idx + 1}`;
        const inputId = `${ocidPrefix}-${idx + 1}`;
        return (
          <label
            key={item}
            htmlFor={inputId}
            data-ocid={ocid}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div
              className={cn(
                "relative h-4 w-4 rounded-sm border flex items-center justify-center flex-shrink-0 transition-smooth",
                checked
                  ? "bg-primary border-primary"
                  : "border-border bg-card group-hover:border-primary/50",
              )}
            >
              <input
                id={inputId}
                type="checkbox"
                checked={checked}
                onChange={() => toggle(item)}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                aria-label={item}
              />
              {checked && (
                <Check className="h-2.5 w-2.5 text-primary-foreground pointer-events-none" />
              )}
            </div>
            <span className="text-sm font-body text-foreground/80 group-hover:text-foreground transition-colors">
              {item}
            </span>
          </label>
        );
      })}
    </div>
  );
}

// ─── Step Indicator ──────────────────────────────────────────────────────────

function StepIndicator({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  const steps = [
    { num: 1 as const, label: "Model Information" },
    { num: 2 as const, label: "Submit Inputs" },
    { num: 3 as const, label: "Configure Report" },
  ];

  return (
    <div className="mb-8" data-ocid="wizard.step_indicator">
      <div className="flex items-stretch gap-0">
        {steps.map((step, idx) => {
          const done = currentStep > step.num;
          const active = currentStep === step.num;
          return (
            <div
              key={step.num}
              className={cn(
                "flex-1 flex flex-col items-center gap-1.5 px-2 pb-3 border-b-2 transition-smooth",
                active
                  ? "border-primary"
                  : done
                    ? "border-secondary"
                    : "border-border",
                idx > 0 && "ml-0",
              )}
              data-ocid={`wizard.step_${step.num}.tab`}
            >
              <div className="flex items-center gap-2 mt-3">
                <div
                  className={cn(
                    "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold flex-shrink-0 transition-smooth",
                    active
                      ? "bg-primary text-primary-foreground"
                      : done
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-muted/30 text-muted-foreground border border-border",
                  )}
                >
                  {done ? <Check className="h-3 w-3" /> : step.num}
                </div>
                <span
                  className={cn(
                    "text-xs font-mono uppercase tracking-widest whitespace-nowrap",
                    active
                      ? "text-primary font-semibold"
                      : done
                        ? "text-secondary"
                        : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 1: Model Information ───────────────────────────────────────────────

type Step1Errors = Partial<Record<keyof AuditWizardStep1, string>>;

function Step1({
  data,
  onChange,
  onNext,
}: {
  data: Partial<AuditWizardStep1>;
  onChange: (d: Partial<AuditWizardStep1>) => void;
  onNext: () => void;
}) {
  const [errors, setErrors] = useState<Step1Errors>({});

  const validate = (): boolean => {
    const e: Step1Errors = {};
    if (!data.modelName?.trim()) e.modelName = "Model name is required";
    if (!data.deploymentContext)
      e.deploymentContext = "Deployment context is required";
    if (!data.intendedPopulation?.trim())
      e.intendedPopulation = "Intended population is required";
    if (!data.jurisdiction) e.jurisdiction = "Jurisdiction is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  return (
    <div className="space-y-6" data-ocid="wizard.step1.section">
      <SectionHeader>Model Identification</SectionHeader>

      <div className="grid grid-cols-2 gap-4">
        <FormInput
          label="Model Name"
          required
          error={errors.modelName}
          className="col-span-2 sm:col-span-1"
        >
          <Input
            value={data.modelName ?? ""}
            onChange={(e) => onChange({ ...data, modelName: e.target.value })}
            placeholder="GPT-4, Claude 3, custom-hiring-model"
            className="bg-card border-border focus:border-primary focus:ring-primary/30 font-body"
            data-ocid="wizard.model_name.input"
          />
        </FormInput>

        <FormInput
          label="Model Version"
          error={errors.modelVersion}
          className="col-span-2 sm:col-span-1"
        >
          <Input
            value={data.modelVersion ?? ""}
            onChange={(e) =>
              onChange({ ...data, modelVersion: e.target.value })
            }
            placeholder="v2.1, 20240229, etc."
            className="bg-card border-border focus:border-primary focus:ring-primary/30 font-body"
            data-ocid="wizard.model_version.input"
          />
        </FormInput>
      </div>

      <FormInput label="Model Provider" error={errors.modelProvider}>
        <Input
          value={data.modelProvider ?? ""}
          onChange={(e) => onChange({ ...data, modelProvider: e.target.value })}
          placeholder="OpenAI, Anthropic, Internal"
          className="bg-card border-border focus:border-primary focus:ring-primary/30 font-body"
          data-ocid="wizard.model_provider.input"
        />
      </FormInput>

      <SectionHeader>Deployment Context</SectionHeader>

      <div className="grid grid-cols-2 gap-4">
        <FormInput
          label="Deployment Context"
          required
          error={errors.deploymentContext}
          className="col-span-2 sm:col-span-1"
        >
          <StyledSelect
            value={data.deploymentContext ?? ""}
            onChange={(v) => onChange({ ...data, deploymentContext: v })}
            options={DEPLOYMENT_CONTEXTS}
            placeholder="Select deployment domain"
            data-ocid="wizard.deployment_context.select"
          />
        </FormInput>

        <FormInput
          label="Geographic Jurisdiction"
          required
          error={errors.jurisdiction}
          className="col-span-2 sm:col-span-1"
        >
          <StyledSelect
            value={data.jurisdiction ?? ""}
            onChange={(v) => onChange({ ...data, jurisdiction: v })}
            options={JURISDICTIONS}
            placeholder="Select jurisdiction"
            data-ocid="wizard.jurisdiction.select"
          />
        </FormInput>
      </div>

      <FormInput
        label="Intended User Population"
        required
        error={errors.intendedPopulation}
      >
        <Textarea
          value={data.intendedPopulation ?? ""}
          onChange={(e) =>
            onChange({ ...data, intendedPopulation: e.target.value })
          }
          placeholder="Describe who will be affected by this model's decisions"
          rows={3}
          className="bg-card border-border focus:border-primary focus:ring-primary/30 font-body resize-none"
          data-ocid="wizard.intended_population.textarea"
        />
      </FormInput>

      <div className="flex justify-end pt-2">
        <Button
          type="button"
          onClick={handleNext}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-mono uppercase tracking-widest text-xs px-6"
          data-ocid="wizard.step1.continue_button"
        >
          Continue <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 2: Submit Inputs ───────────────────────────────────────────────────

type Step2Errors = {
  input?: string;
  biasDimensions?: string;
  safetyChecks?: string;
};

function CsvDropzone({
  csvFile,
  onFile,
  onClear,
}: {
  csvFile: File | null;
  onFile: (f: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file?.name.endsWith(".csv")) onFile(file);
    },
    [onFile],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  };

  const estimatedRows = csvFile ? Math.floor(csvFile.size / 100) : 0;

  return (
    <div>
      {csvFile ? (
        <div className="flex items-center gap-3 p-4 border border-primary/40 rounded bg-primary/5">
          <div className="h-8 w-8 rounded bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Upload className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-mono text-foreground truncate">
              {csvFile.name}
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              ~{estimatedRows} rows · {(csvFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="text-muted-foreground hover:text-destructive transition-smooth flex-shrink-0"
            aria-label="Remove file"
            data-ocid="wizard.csv_clear.button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          className={cn(
            "w-full border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-smooth",
            dragging
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50 hover:bg-card/50",
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          data-ocid="wizard.csv.dropzone"
          aria-label="Upload CSV file"
        >
          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-body text-foreground/70">
            Drop your CSV file here or{" "}
            <span className="text-primary underline underline-offset-2">
              click to browse
            </span>
          </p>
          <p className="text-xs font-mono text-muted-foreground mt-1">
            .csv only · max 5MB
          </p>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleChange}
        data-ocid="wizard.csv_file.input"
      />
    </div>
  );
}

function Step2({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: Partial<AuditWizardStep2>;
  onChange: (d: Partial<AuditWizardStep2>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState<InputTab>("text");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Step2Errors>({});

  const biasDimensions = data.selectedBiasDimensions ?? BIAS_DIMENSIONS;
  const safetyChecks = data.selectedSafetyChecks ?? SAFETY_CHECKS;

  const lineCount = (data.inputText ?? "")
    .split("\n")
    .filter((l) => l.trim()).length;
  const charCount = (data.inputText ?? "").length;

  const validate = (): boolean => {
    const e: Step2Errors = {};
    const hasText =
      activeTab === "text" && (data.inputText ?? "").trim().length > 0;
    const hasCsv = activeTab === "csv" && csvFile !== null;
    if (!hasText && !hasCsv) {
      e.input =
        activeTab === "api"
          ? "API endpoint integration coming soon — use text or CSV input"
          : "Provide at least some model output to analyze";
    }
    if (biasDimensions.length === 0)
      e.biasDimensions = "Select at least one bias dimension";
    if (safetyChecks.length === 0)
      e.safetyChecks = "Select at least one safety check";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  const INPUT_TABS: { id: InputTab; label: string }[] = [
    { id: "text", label: "Paste Text" },
    { id: "csv", label: "Upload CSV" },
    { id: "api", label: "API Endpoint" },
  ];

  return (
    <div className="space-y-8" data-ocid="wizard.step2.section">
      {/* Input Method */}
      <div>
        <SectionHeader>Model Outputs</SectionHeader>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-border mb-4">
          {INPUT_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              data-ocid={`wizard.input_${tab.id}.tab`}
              className={cn(
                "px-5 py-2.5 text-xs font-mono uppercase tracking-widest transition-smooth border-b-2 -mb-px",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        {activeTab === "text" && (
          <div>
            <Textarea
              value={data.inputText ?? ""}
              onChange={(e) => onChange({ ...data, inputText: e.target.value })}
              placeholder="Paste model outputs, one per line (max 500 entries)"
              rows={8}
              className="bg-card border-border focus:border-primary focus:ring-primary/30 font-mono text-sm resize-none"
              data-ocid="wizard.paste_text.textarea"
            />
            <p className="mt-1.5 text-xs font-mono text-muted-foreground text-right">
              {lineCount} lines · {charCount} characters
            </p>
          </div>
        )}

        {activeTab === "csv" && (
          <CsvDropzone
            csvFile={csvFile}
            onFile={(f) => {
              setCsvFile(f);
              onChange({ ...data, inputCsvUrl: f.name });
            }}
            onClear={() => {
              setCsvFile(null);
              onChange({ ...data, inputCsvUrl: "" });
            }}
          />
        )}

        {activeTab === "api" && (
          <div className="space-y-3">
            <div className="relative">
              <Input
                placeholder="https://api.yourmodel.com/v1/generate"
                disabled
                className="bg-card/50 border-border text-muted-foreground font-mono text-sm pr-32"
                data-ocid="wizard.api_url.input"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <DefinitionTooltip
                  term="Coming Soon"
                  definition="Live API sampling will be available in a future update. Use Paste Text or Upload CSV to submit model outputs."
                >
                  <button
                    type="button"
                    disabled
                    className="text-xs font-mono text-muted-foreground/50 px-3 py-1 border border-border/50 rounded cursor-not-allowed"
                  >
                    Sample 50 outputs
                  </button>
                </DefinitionTooltip>
              </div>
            </div>
            <p className="text-xs font-mono text-muted-foreground">
              Live API endpoint sampling is coming soon. Use Paste Text or
              Upload CSV in the meantime.
            </p>
          </div>
        )}

        {errors.input && <FieldError message={errors.input} />}
      </div>

      {/* Bias Dimensions */}
      <div>
        <SectionHeader
          tooltip={{
            term: "Bias Dimensions",
            definition:
              "Statistical analysis of differential model behavior across demographic groups",
          }}
        >
          Bias Dimensions to Probe
        </SectionHeader>
        <CheckboxGroup
          items={BIAS_DIMENSIONS}
          selected={biasDimensions}
          onChange={(items) =>
            onChange({ ...data, selectedBiasDimensions: items })
          }
          columns={2}
          ocidPrefix="wizard.bias_dimension"
        />
        {errors.biasDimensions && (
          <FieldError message={errors.biasDimensions} />
        )}
      </div>

      {/* Safety Checks */}
      <div>
        <SectionHeader>Safety Checks</SectionHeader>
        <CheckboxGroup
          items={SAFETY_CHECKS}
          selected={safetyChecks}
          onChange={(items) =>
            onChange({ ...data, selectedSafetyChecks: items })
          }
          columns={2}
          ocidPrefix="wizard.safety_check"
        />
        {errors.safetyChecks && <FieldError message={errors.safetyChecks} />}
      </div>

      <div className="flex justify-between pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="font-mono uppercase tracking-widest text-xs text-muted-foreground hover:text-foreground"
          data-ocid="wizard.step2.back_button"
        >
          ← Back
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-mono uppercase tracking-widest text-xs px-6"
          data-ocid="wizard.step2.continue_button"
        >
          Continue <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 3: Configure Report ────────────────────────────────────────────────

type Step3Errors = {
  frameworks?: string;
};

function AuditSummaryBox({
  modelName,
  deploymentContext,
  biasDimensionCount,
  safetyCheckCount,
  frameworkCount,
}: {
  modelName: string;
  deploymentContext: string;
  biasDimensionCount: number;
  safetyCheckCount: number;
  frameworkCount: number;
}) {
  const rows = [
    { label: "Model", value: modelName || "—" },
    { label: "Context", value: deploymentContext || "—" },
    { label: "Bias dimensions", value: `${biasDimensionCount} selected` },
    { label: "Safety checks", value: `${safetyCheckCount} selected` },
    { label: "Regulatory frameworks", value: `${frameworkCount} selected` },
  ];

  return (
    <div
      className="border border-border rounded bg-card p-4 space-y-0"
      data-ocid="wizard.audit_summary.panel"
    >
      <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
        Audit Summary
      </p>
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-baseline justify-between py-1.5 border-b border-border/40 last:border-0"
        >
          <span className="text-xs font-mono text-muted-foreground">
            {row.label}
          </span>
          <span className="text-sm font-mono text-foreground truncate ml-4 max-w-[60%] text-right">
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function Step3({
  data,
  onChangeStep3,
  step1Data,
  step2Data,
  onBack,
  onSubmit,
  isSubmitting,
}: {
  data: Partial<AuditWizardStep3>;
  onChangeStep3: (d: Partial<AuditWizardStep3>) => void;
  step1Data: Partial<AuditWizardStep1>;
  step2Data: Partial<AuditWizardStep2>;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}) {
  const [errors, setErrors] = useState<Step3Errors>({});

  const frameworks = data.selectedFrameworks ?? [
    "EU AI Act",
    "NYC Local Law 144",
  ];
  const tone = data.summaryTone ?? "technical";

  const validate = (): boolean => {
    const e: Step3Errors = {};
    if (frameworks.length === 0)
      e.frameworks = "Select at least one regulatory framework";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) onSubmit();
  };

  return (
    <div className="space-y-8" data-ocid="wizard.step3.section">
      <div>
        <SectionHeader>Report Configuration</SectionHeader>

        <div className="space-y-6">
          <FormInput label="Report Title">
            <Input
              value={data.reportTitle ?? ""}
              onChange={(e) =>
                onChangeStep3({ ...data, reportTitle: e.target.value })
              }
              placeholder={`Audit: ${step1Data.modelName ?? "Model"} ${new Date().toISOString().split("T")[0]}`}
              className="bg-card border-border focus:border-primary focus:ring-primary/30 font-mono text-sm"
              data-ocid="wizard.report_title.input"
            />
          </FormInput>

          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-3">
              Regulatory Frameworks<span className="text-primary ml-1">*</span>
            </Label>
            <CheckboxGroup
              items={REGULATORY_FRAMEWORKS}
              selected={frameworks}
              onChange={(items) =>
                onChangeStep3({ ...data, selectedFrameworks: items })
              }
              columns={2}
              ocidPrefix="wizard.framework"
            />
            {errors.frameworks && <FieldError message={errors.frameworks} />}
          </div>

          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
              Executive Summary Tone
            </p>
            <div className="flex gap-6">
              {SUMMARY_TONES.map((t) => {
                const radioId = `tone-${t.value}`;
                return (
                  <label
                    key={t.value}
                    htmlFor={radioId}
                    className="flex items-center gap-2 cursor-pointer group"
                    data-ocid={`wizard.tone_${t.value}.radio`}
                  >
                    <div
                      className={cn(
                        "relative h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-smooth",
                        tone === t.value
                          ? "border-primary bg-primary"
                          : "border-border group-hover:border-primary/50",
                      )}
                    >
                      <input
                        id={radioId}
                        type="radio"
                        name="summaryTone"
                        value={t.value}
                        checked={tone === t.value}
                        onChange={() =>
                          onChangeStep3({ ...data, summaryTone: t.value })
                        }
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      />
                      {tone === t.value && (
                        <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground pointer-events-none" />
                      )}
                    </div>
                    <span className="text-sm font-body text-foreground/80 group-hover:text-foreground transition-colors">
                      {t.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <AuditSummaryBox
        modelName={step1Data.modelName ?? ""}
        deploymentContext={step1Data.deploymentContext ?? ""}
        biasDimensionCount={
          (step2Data.selectedBiasDimensions ?? BIAS_DIMENSIONS).length
        }
        safetyCheckCount={
          (step2Data.selectedSafetyChecks ?? SAFETY_CHECKS).length
        }
        frameworkCount={frameworks.length}
      />

      <div className="flex justify-between pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          disabled={isSubmitting}
          className="font-mono uppercase tracking-widest text-xs text-muted-foreground hover:text-foreground"
          data-ocid="wizard.step3.back_button"
        >
          ← Back
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={cn(
            "gap-2 px-8 py-2 font-mono uppercase tracking-widest text-sm",
            "bg-primary text-primary-foreground hover:bg-primary/90",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
          data-ocid="wizard.submit_audit.primary_button"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting audit…
            </>
          ) : (
            <>Submit Audit →</>
          )}
        </Button>
      </div>

      {isSubmitting && (
        <div
          className="text-center py-4 text-xs font-mono text-muted-foreground tracking-widest"
          data-ocid="wizard.submit.loading_state"
        >
          Running AI analysis — this may take 30–60 seconds…
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function NewAuditPage() {
  const navigate = useNavigate();
  const { step, setStep, formData, updateFormData, resetWizard } =
    useAuditStore();

  const [step1Data, setStep1Data] = useState<Partial<AuditWizardStep1>>({
    modelName: (formData.modelName as string) ?? "",
    modelVersion: (formData.modelVersion as string) ?? "",
    modelProvider: (formData.modelProvider as string) ?? "",
    deploymentContext: (formData.deploymentContext as string) ?? "",
    intendedPopulation: (formData.intendedPopulation as string) ?? "",
    jurisdiction: (formData.jurisdiction as string) ?? "",
  });

  const [step2Data, setStep2Data] = useState<Partial<AuditWizardStep2>>({
    inputText: (formData.inputText as string) ?? "",
    inputCsvUrl: (formData.inputCsvUrl as string) ?? "",
    selectedBiasDimensions:
      (formData.selectedBiasDimensions as string[]) ?? BIAS_DIMENSIONS,
    selectedSafetyChecks:
      (formData.selectedSafetyChecks as string[]) ?? SAFETY_CHECKS,
  });

  const defaultReportTitle = `Audit: ${step1Data.modelName || "Model"} ${new Date().toISOString().split("T")[0]}`;
  const [step3Data, setStep3Data] = useState<Partial<AuditWizardStep3>>({
    reportTitle: (formData.reportTitle as string) ?? defaultReportTitle,
    summaryTone: (formData.summaryTone as string) ?? "technical",
    selectedFrameworks: (formData.selectedFrameworks as string[]) ?? [
      "EU AI Act",
      "NYC Local Law 144",
    ],
  });

  const [submitError, setSubmitError] = useState<string | null>(null);

  const createAudit = useCreateAudit();
  const runAudit = useRunAudit();
  const isSubmitting = createAudit.isPending || runAudit.isPending;

  const handleNext = () => {
    if (step === 1) {
      updateFormData(step1Data as Partial<AuditInput>);
      setStep(2);
    } else if (step === 2) {
      updateFormData(step2Data as Partial<AuditInput>);
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  };

  const handleSubmit = async () => {
    setSubmitError(null);

    const reportTitle = step3Data.reportTitle?.trim() || defaultReportTitle;

    const input: AuditInput = {
      modelName: step1Data.modelName ?? "",
      modelVersion: step1Data.modelVersion ?? undefined,
      modelProvider: step1Data.modelProvider ?? undefined,
      deploymentContext: step1Data.deploymentContext ?? "",
      intendedPopulation: step1Data.intendedPopulation ?? "",
      jurisdiction: step1Data.jurisdiction ?? "",
      inputText: step2Data.inputText ?? undefined,
      inputCsvUrl: step2Data.inputCsvUrl ?? undefined,
      selectedBiasDimensions:
        step2Data.selectedBiasDimensions ?? BIAS_DIMENSIONS,
      selectedSafetyChecks: step2Data.selectedSafetyChecks ?? SAFETY_CHECKS,
      reportTitle,
      summaryTone: step3Data.summaryTone ?? "technical",
      selectedFrameworks: step3Data.selectedFrameworks ?? [],
      outputCount: undefined,
    };

    try {
      const auditId = await createAudit.mutateAsync(input);
      await runAudit.mutateAsync(auditId);
      resetWizard();
      navigate({ to: `/audit/${auditId}` });
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Failed to submit audit. Please try again.",
      );
    }
  };

  return (
    <div className="max-w-[760px] mx-auto pb-16" data-ocid="new_audit.page">
      {/* Page Header */}
      <div className="mb-8 border-b border-border pb-6">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-1">
          New Audit
        </p>
        <h1 className="font-display text-3xl font-bold text-foreground leading-tight">
          Submit Model for Audit
        </h1>
        <p className="mt-2 text-sm font-body text-muted-foreground max-w-prose">
          Provide your model details and outputs. Our AI analysis engine will
          generate a structured transparency report with bias flags, safety
          scores, and regulatory mapping.
        </p>
      </div>

      {/* Step Indicator */}
      <StepIndicator currentStep={step} />

      {/* Submit Error */}
      {submitError && (
        <div
          className="mb-6 p-4 border border-destructive/40 bg-destructive/10 rounded flex items-start gap-3"
          data-ocid="wizard.submit.error_state"
        >
          <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm font-mono text-destructive">{submitError}</p>
        </div>
      )}

      {/* Step Content */}
      <div className="bg-card border border-border rounded-lg p-6 lg:p-8">
        {step === 1 && (
          <Step1 data={step1Data} onChange={setStep1Data} onNext={handleNext} />
        )}
        {step === 2 && (
          <Step2
            data={step2Data}
            onChange={setStep2Data}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {step === 3 && (
          <Step3
            data={step3Data}
            onChangeStep3={setStep3Data}
            step1Data={step1Data}
            step2Data={step2Data}
            onBack={handleBack}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </div>

      {/* Step counter footnote */}
      <p className="mt-4 text-center text-xs font-mono text-muted-foreground/50 tracking-widest">
        STEP {step} OF 3
      </p>
    </div>
  );
}
