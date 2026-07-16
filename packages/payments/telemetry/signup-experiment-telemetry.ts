/**
 * VPN 2024 Signup Experiment Telemetry
 *
 * Events specific to the VPN single-signup Pass upsell experiment (`Vpn2024SignupExperiment`).
 * These use fixed names and are intentionally kept separate from the shared checkout telemetry
 * and from the subscription-modification experiment events.
 */
import { telemetry } from '@proton/shared/lib/telemetry';

/**
 * Reports the first time the VPN 2024 signup experiment variant is seen.
 *
 * **Event Name:** `vpn_signup_vpn2024_experiment_seen`
 *
 * **When to call:** Once on mount when the signup page shows a VPN Plus / VPN+Pass plan,
 * after feature flags are ready. Use the `useVpn2024SignupExperiment` hook for automatic tracking.
 *
 * **Purpose:** Track experiment exposure — which variant each user was assigned to.
 *
 * @param props.variant - The experiment variant name (`'pass-addon-only'` or `'no-addon'`)
 */
export function reportVpn2024SignupExperimentSeen(props: { variant: 'pass-addon-only' | 'no-addon' | 'disabled' }) {
    telemetry.sendCustomEvent('vpn_signup_vpn2024_experiment_seen', props);
}

/**
 * Reports when the user adds Proton Pass from the signup upsell box.
 *
 * **Event Name:** `vpn_signup_add_pass`
 *
 * **When to call:** Each time the user clicks the "Add Pass" button in the signup upsell box.
 * **Purpose:** Track interest in the Pass addon during signup.
 */
export function reportVpn2024SignupAddPass() {
    telemetry.sendCustomEvent('vpn_signup_add_pass');
}
