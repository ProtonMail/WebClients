import type { AutoFillSettings } from '@proton/pass/types/worker/settings';

/** When migrating to >=1.24.0 :
 * - if `inject` AND `openOnFocus` are undefined then it's a
 *   new install and we can enable autofill by default.
 * - if one of `inject` OR `openOnFocus` is enabled, enable
 *   autofill */
export const enableLoginAutofill = (autofill: AutoFillSettings) =>
    (typeof autofill.inject === 'undefined' && typeof autofill.openOnFocus === 'undefined') ||
    Boolean(autofill.inject || autofill.openOnFocus);
