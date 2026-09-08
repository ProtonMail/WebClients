import {
    ADD_LUMO_CONTEXT_MAPPING,
    ADD_MEET_CONTEXT_MAPPING,
    ADD_PASS_CONTEXT_MAPPING,
    CHANGE_BILLING_COUNTRY_CONTEXT_MAPPING,
    ESTIMATION_CHANGE_CONTEXT_MAPPING,
    INITIALIZATION_CONTEXT_MAPPING,
    PAYMENT_CONTEXT_MAPPING,
    UPSELL_MODAL_OPEN_CONTEXT_MAPPING,
} from './shared-checkout-telemetry';

/**
 * Event names are the contract with the data team: renaming one silently breaks their dashboards.
 * The snapshot exists so that any rename shows up as a reviewable diff. If it fails, either revert
 * the rename or update the snapshot and notify the data team.
 */
it('emits a stable event name for every context', () => {
    expect({
        add_lumo: ADD_LUMO_CONTEXT_MAPPING,
        add_meet: ADD_MEET_CONTEXT_MAPPING,
        add_pass: ADD_PASS_CONTEXT_MAPPING,
        change_billing_country: CHANGE_BILLING_COUNTRY_CONTEXT_MAPPING,
        estimation_change: ESTIMATION_CHANGE_CONTEXT_MAPPING,
        init: INITIALIZATION_CONTEXT_MAPPING,
        open_modal: UPSELL_MODAL_OPEN_CONTEXT_MAPPING,
        payment: PAYMENT_CONTEXT_MAPPING,
    }).toMatchSnapshot();
});

it('emits the event names from the upsell tracking spec', () => {
    expect(INITIALIZATION_CONTEXT_MAPPING['settings-upgrade']).toBe('settings_upgrade_init');
    expect(INITIALIZATION_CONTEXT_MAPPING['account-home']).toBe('account_home_init');
    expect(UPSELL_MODAL_OPEN_CONTEXT_MAPPING['settings-upgrade']).toBe('settings_upgrade_open_modal');
    expect(UPSELL_MODAL_OPEN_CONTEXT_MAPPING['account-home']).toBe('account_home_open_modal');
});
