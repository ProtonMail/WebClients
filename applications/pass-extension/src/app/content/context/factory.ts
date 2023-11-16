import { createAutofillService } from 'proton-pass-extension/app/content/services/form/autofill';
import { createAutosaveService } from 'proton-pass-extension/app/content/services/form/autosave';
import { createDetectorService } from 'proton-pass-extension/app/content/services/form/detector';
import { createFormManager } from 'proton-pass-extension/app/content/services/form/manager';
import { createIFrameService } from 'proton-pass-extension/app/content/services/iframes/service';
import { ExtensionContext } from 'proton-pass-extension/lib/context/extension-context';

import { hasCriteria } from '@proton/pass/lib/settings/criteria';
import type { FeatureFlagState } from '@proton/pass/store/reducers';
import { INITIAL_SETTINGS, type ProxiedSettings } from '@proton/pass/store/reducers/settings';
import { AppStatus } from '@proton/pass/types';
import type { PassFeature } from '@proton/pass/types/api/features';

import { CSContext } from './context';
import type { CSContextState, ContentScriptContext } from './types';

export const createContentScriptContext = (options: {
    scriptId: string;
    mainFrame: boolean;
    destroy: (options: { reason: string }) => void;
}): ContentScriptContext => {
    const state: CSContextState = { active: true, loggedIn: false, status: AppStatus.IDLE, UID: undefined };
    const settings: ProxiedSettings = INITIAL_SETTINGS;
    const featureFlags: FeatureFlagState = {};

    const context: ContentScriptContext = CSContext.set({
        mainFrame: options.mainFrame,
        service: {
            autofill: createAutofillService(),
            autosave: createAutosaveService(),
            detector: createDetectorService(),
            formManager: createFormManager({
                /* attach or detach dropdown based on the
                 * detection results. If forms have been detected
                 * sync the autofillable items count */
                onDetection: (forms) => {
                    const didDetect = forms.length > 0;
                    context.service.iframe[didDetect ? 'attachDropdown' : 'detachDropdown']();
                },
            }),
            iframe: createIFrameService(),
        },
        scriptId: options.scriptId,

        destroy: options.destroy,
        getExtensionContext: () => ExtensionContext.get(),
        getFeatureFlags: () => featureFlags,
        getFeatures: () => {
            const disallowed = settings.disallowedDomains ?? {};
            const { domain, subdomain } = context.getExtensionContext().url;

            /* merge domain and subdomain masks if we have both in the pause-list */
            const domainMask = domain ? disallowed[domain] : 0;
            const subDomainMask = subdomain ? disallowed[subdomain] : 0;
            const mask = domainMask | subDomainMask;

            const { autofill, autosuggest, autosave } = settings;

            return {
                Autofill: autofill.inject && !hasCriteria(mask, 'Autofill'),
                Autofill2FA: !hasCriteria(mask, 'Autofill2FA'),
                AutosuggestPassword: autosuggest.password && !hasCriteria(mask, 'Autosuggest'),
                AutosuggestAlias: autosuggest.email && !hasCriteria(mask, 'Autosuggest'),
                Autosave: autosave.prompt && !hasCriteria(mask, 'Autosave'),
            };
        },
        getSettings: () => settings,
        getState: () => state,
        setFeatureFlags: (update) => {
            (Object.keys(featureFlags) as PassFeature[]).forEach((key) => delete featureFlags[key]);
            return Object.assign(featureFlags, update);
        },
        setSettings: (update) => Object.assign(settings, update),
        setState: (update) => Object.assign(state, update),
    });

    return context;
};
