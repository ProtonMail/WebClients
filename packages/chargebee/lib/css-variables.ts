import { sanitizeObject } from './sanitize-object';

const chargebeeCssVariables = [
    '--signal-danger',
    '--border-radius-md',
    '--border-norm',
    '--focus-outline',
    '--focus-ring',
    '--field-norm',
    '--field-background-color',
    '--field-focus-background-color',
    '--field-focus-text-color',
    '--field-placeholder-color',
    '--field-text-color',
    '--selection-text-color',
    '--selection-background-color',
    '--interaction-norm',
    '--interaction-norm-contrast',
    '--interaction-norm-major-1',
    '--interaction-norm-major-2',
] as const;

export const chargebeeCssVariablesSet = new Set(chargebeeCssVariables);

export type ChargebeeCssVariable = (typeof chargebeeCssVariables)[number];
export type ChargebeeCssVariables = Record<ChargebeeCssVariable, string>;

export function sanitizeChargebeeCssVariables(cssVariablesInput: Record<string, string>): ChargebeeCssVariables {
    return sanitizeObject(cssVariablesInput, chargebeeCssVariablesSet);
}
