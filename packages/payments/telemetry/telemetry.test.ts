import {
    ADD_LUMO_CONTEXT_MAPPING,
    CHANGE_BILLING_COUNTRY_CONTEXT_MAPPING,
    ESTIMATION_PARAMETERS_CHANGE_CONTEXT_MAPPING,
    INITIALIZATION_CONTEXT_MAPPING,
    PAYMENT_CONTEXT_MAPPING,
    UPSELL_MODAL_OPEN_CONTEXT_MAPPING,
} from './shared-checkout-telemetry';

it('mappings must be complete', () => {
    expect(Object.values(ADD_LUMO_CONTEXT_MAPPING).every((it) => !!it)).toBe(true);
    expect(Object.values(CHANGE_BILLING_COUNTRY_CONTEXT_MAPPING).every((it) => !!it)).toBe(true);
    expect(Object.values(ESTIMATION_PARAMETERS_CHANGE_CONTEXT_MAPPING).every((it) => !!it)).toBe(true);
    expect(Object.values(INITIALIZATION_CONTEXT_MAPPING).every((it) => !!it)).toBe(true);
    expect(Object.values(PAYMENT_CONTEXT_MAPPING).every((it) => !!it)).toBe(true);
    expect(Object.values(UPSELL_MODAL_OPEN_CONTEXT_MAPPING).every((it) => !!it)).toBe(true);
});

it('emits the event names from the upsell tracking spec', () => {
    expect(INITIALIZATION_CONTEXT_MAPPING['settings-upgrade']).toBe('settings_upgrade_init');
    expect(INITIALIZATION_CONTEXT_MAPPING['account-home']).toBe('account_home_init');
    expect(UPSELL_MODAL_OPEN_CONTEXT_MAPPING['settings-upgrade']).toBe('settings_upgrade_open_modal');
    expect(UPSELL_MODAL_OPEN_CONTEXT_MAPPING['account-home']).toBe('account_home_open_modal');
});
