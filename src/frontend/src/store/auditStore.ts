import { create } from "zustand";
import type { AuditInput } from "../types/audit";

export type WizardStep = 1 | 2 | 3;

interface AuditWizardState {
  step: WizardStep;
  formData: Partial<AuditInput>;
  setStep: (step: WizardStep) => void;
  updateFormData: (data: Partial<AuditInput>) => void;
  resetWizard: () => void;
}

const initialFormData: Partial<AuditInput> = {
  selectedBiasDimensions: [],
  selectedSafetyChecks: [],
  selectedFrameworks: [],
  summaryTone: "technical",
};

export const useAuditStore = create<AuditWizardState>((set) => ({
  step: 1,
  formData: initialFormData,
  setStep: (step) => set({ step }),
  updateFormData: (data) =>
    set((state) => ({ formData: { ...state.formData, ...data } })),
  resetWizard: () => set({ step: 1, formData: initialFormData }),
}));
