import {
    ADD_LUMO_CONTEXT_MAPPING,
    CHANGE_BILLING_COUNTRY_CONTEXT_MAPPING,
    ESTIMATION_PARAMETERS_CHANGE_CONTEXT_MAPPING,
    INITIALIZATION_CONTEXT_MAPPING,
    PAYMENT_CONTEXT_MAPPING,
} from './shared-checkout-telemetry';

it('mappings must be complete', () => {
    expect(Object.values(ADD_LUMO_CONTEXT_MAPPING).every((it) => !!it)).toBe(true);
    expect(Object.values(CHANGE_BILLING_COUNTRY_CONTEXT_MAPPING).every((it) => !!it)).toBe(true);
    expect(Object.values(ESTIMATION_PARAMETERS_CHANGE_CONTEXT_MAPPING).every((it) => !!it)).toBe(true);
    expect(Object.values(INITIALIZATION_CONTEXT_MAPPING).every((it) => !!it)).toBe(true);
    expect(Object.values(PAYMENT_CONTEXT_MAPPING).every((it) => !!it)).toBe(true);
});
