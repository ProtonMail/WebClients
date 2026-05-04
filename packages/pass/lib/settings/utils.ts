import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import { selectCanCreateItems } from '@proton/pass/store/selectors/shares';
import type { State } from '@proton/pass/store/types';
import type { AutoFillSettings } from '@proton/pass/types/worker/settings';
import { partialMerge } from '@proton/pass/utils/object/merge';

/** When migrating to >=1.24.0 :
 * - if `inject` AND `openOnFocus` are undefined then it's a
 *   new install and we can enable autofill by default.
 * - if one of `inject` OR `openOnFocus` is enabled, enable
 *   autofill */
export const enableLoginAutofill = (autofill: AutoFillSettings) =>
    (typeof autofill.inject === 'undefined' && typeof autofill.openOnFocus === 'undefined') ||
    Boolean(autofill.inject || autofill.openOnFocus);

/** If a user cannot create items, disables any extension
 * setting that could trigger item create/edit. */
export const sanitizeSettings = (settings: ProxiedSettings, state: State): ProxiedSettings => {
    return selectCanCreateItems(state)
        ? settings
        : partialMerge(settings, {
              autosave: { prompt: false, passwordSuggest: false },
              passkeys: { create: false },
          });
};
