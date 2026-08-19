import { chargebeeCssVariablesSet, sanitizeChargebeeCssVariables } from './css-variables';

describe('sanitizeChargebeeCssVariables', () => {
    it('returns an empty object for an empty input', () => {
        expect(sanitizeChargebeeCssVariables({})).toEqual({});
    });

    it('keeps only the authorized css variables', () => {
        const result = sanitizeChargebeeCssVariables({
            '--signal-danger': '#fff',
            '--not-authorized': 'red',
            '--field-text-color': '#000',
            '--evil-property': 'red',
        });

        expect(result).toEqual({
            '--signal-danger': '#fff',
            '--field-text-color': '#000',
        });
    });

    it('drops unauthorized variables while keeping their values for the authorized ones', () => {
        const result = sanitizeChargebeeCssVariables({
            '--border-radius-md': '4px',
            '--focus-ring': '1px',
        });

        expect(Object.keys(result)).toEqual(['--border-radius-md', '--focus-ring']);
        expect(result['--border-radius-md']).toBe('4px');
    });

    it('preserves every authorized variable untouched', () => {
        const input: Record<string, string> = {};
        chargebeeCssVariablesSet.forEach((variable, index) => {
            input[variable] = `value-${index}`;
        });

        expect(sanitizeChargebeeCssVariables(input)).toEqual(input);
    });
});
