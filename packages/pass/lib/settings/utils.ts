import { mergeWithOrgPauseList } from '@proton/pass/lib/settings/pause-list';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import { selectOrgDisallowedDomains } from '@proton/pass/store/selectors/organization';
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

/** - Merges the organization pause list on top of the user pause list.
 * - If a user cannot create items, disables any extension setting
 * that could trigger item create/edit. */
export const sanitizeSettings = (settings: ProxiedSettings, state: State): ProxiedSettings => {
    const mergedSettings: ProxiedSettings = {
        ...settings,
        disallowedDomains: mergeWithOrgPauseList(settings.disallowedDomains, selectOrgDisallowedDomains(state)),
    };

    return selectCanCreateItems(state)
        ? mergedSettings
        : partialMerge(mergedSettings, {
              autosave: { prompt: false, passwordSuggest: false },
              passkeys: { create: false },
          });
};
