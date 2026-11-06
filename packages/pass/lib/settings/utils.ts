import type { ProxiedSettings } from '../../store/reducers/settings';
import { selectOrgPasskeyDisabled, selectOrgTOTPDisabled } from '../../store/selectors/organization';
import { selectCanCreateItems } from '../../store/selectors/shares';
import type { State } from '../../store/types';
import type { RecursivePartial } from '../../types/utils';
import type { AutoFillSettings } from '../../types/worker/settings';
import { truthy } from '../../utils/fp/predicates';
import { partialMerge } from '../../utils/object/merge';

/** When migrating to >=1.24.0 :
 * - if `inject` AND `openOnFocus` are undefined then it's a
 *   new install and we can enable autofill by default.
 * - if one of `inject` OR `openOnFocus` is enabled, enable
 *   autofill */
export const enableLoginAutofill = (autofill: AutoFillSettings) =>
    (typeof autofill.inject === 'undefined' && typeof autofill.openOnFocus === 'undefined') ||
    Boolean(autofill.inject || autofill.openOnFocus);

/** Forces off the extension settings that the user's permissions
 * or organization policies do not allow:
 * - cannot create items: anything that could trigger item create/edit
 * - organization disallows TOTP: 2FA autofill and auto-copy
 * - organization disallows passkeys: saving and authenticating with passkeys */
export const sanitizeSettings = (settings: ProxiedSettings, state: State): ProxiedSettings => {
    const overrides: (false | RecursivePartial<ProxiedSettings>)[] = [
        !selectCanCreateItems(state) && {
            autosave: { prompt: false, passwordSuggest: false },
            passkeys: { create: false },
        },
        selectOrgTOTPDisabled(state) && { autofill: { twofa: false, twofaCopy: false } },
        selectOrgPasskeyDisabled(state) && { passkeys: { create: false, get: false } },
    ];

    return overrides
        .filter(truthy)
        .reduce<ProxiedSettings>((sanitized, override) => partialMerge(sanitized, override), settings);
};
