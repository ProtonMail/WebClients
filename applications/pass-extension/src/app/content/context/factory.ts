import { createAutofillService } from 'proton-pass-extension/app/content/services/form/autofill';
import { createAutosaveService } from 'proton-pass-extension/app/content/services/form/autosave';
import { createDetectorService } from 'proton-pass-extension/app/content/services/form/detector';
import { createFormManager } from 'proton-pass-extension/app/content/services/form/manager';
import { createIFrameService } from 'proton-pass-extension/app/content/services/iframes/service';
import { createWebAuthNService } from 'proton-pass-extension/app/content/services/webauthn';
import { ExtensionContext } from 'proton-pass-extension/lib/context/extension-context';

import { hasCriteria } from '@proton/pass/lib/settings/criteria';
import type { FeatureFlagState } from '@proton/pass/store/reducers';
import { type ProxiedSettings, getInitialSettings } from '@proton/pass/store/reducers/settings';
import { AppStatus } from '@proton/pass/types';
import type { PassFeature } from '@proton/pass/types/api/features';
import type { PassElementsConfig } from '@proton/pass/types/utils/dom';

import { CSContext } from './context';
import type { CSContextState, ContentScriptContext } from './types';

export const createContentScriptContext = (options: {
    scriptId: string;
    mainFrame: boolean;
    elements: PassElementsConfig;
    destroy: (options: { reason: string }) => void;
}): ContentScriptContext => {
    const state: CSContextState = {
        booted: false,
        localID: undefined,
        loggedIn: false,
        ready: false,
        stale: false,
        status: AppStatus.IDLE,
        UID: undefined,
    };

    const settings: ProxiedSettings = getInitialSettings();
    const featureFlags: FeatureFlagState = {};

    const context: ContentScriptContext = CSContext.set({
        elements: options.elements,
        mainFrame: options.mainFrame,
        scriptId: options.scriptId,

        service: {
            autofill: createAutofillService(),
            autosave: createAutosaveService(),
            detector: createDetectorService(),
            formManager: createFormManager({
                onDetection: (forms) => {
                    /* attach or detach dropdown based on the detection results */
                    const didDetect = forms.length > 0;
                    if (didDetect) context.service.iframe.attachDropdown();
                    else context.service.iframe.dropdown?.destroy();
                },
            }),
            iframe: createIFrameService(options.elements),
            webauthn: BUILD_TARGET !== 'safari' ? createWebAuthNService() : undefined,
        },

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

            const { autofill, autosuggest, autosave, passkeys } = settings;

            return {
                /** autofill can only be active if user has injection or "open on focus" setup */
                Autofill: (autofill.inject || autofill.openOnFocus) && !hasCriteria(mask, 'Autofill'),
                Autofill2FA: autofill.twofa && !hasCriteria(mask, 'Autofill2FA'),
                AutosuggestPassword: autosuggest.password && !hasCriteria(mask, 'Autosuggest'),
                AutosuggestAlias: autosuggest.email && !hasCriteria(mask, 'Autosuggest'),
                Autosave: autosave.prompt && !hasCriteria(mask, 'Autosave'),
                Passkeys: (passkeys.create || passkeys.get) && !hasCriteria(mask, 'Passkey'),
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
