/** Acknowledges that validated tool arguments can be rendered; UI content stays in the tool-call arguments. */
export interface ClientToolSuccessResult {
    ok: true;
    message: string;
}

/** Result of validating decoded client-tool arguments. */
export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

export const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

export const isNonBlankString = (value: unknown): value is string => typeof value === 'string' && /\S/.test(value);

export const isIntegerInRange = (value: unknown, min: number, max: number): value is number =>
    typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;

export const getUnexpectedProperty = (value: Record<string, unknown>, properties: Record<string, unknown>) =>
    Object.keys(value).find((key) => !Object.prototype.hasOwnProperty.call(properties, key));

export const invalidArguments = (error: string): ValidationResult<never> => ({ ok: false, error });
