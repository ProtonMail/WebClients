import type { AutofillService } from 'proton-pass-extension/app/content/services/form/autofill';
import type { AutosaveService } from 'proton-pass-extension/app/content/services/form/autosave';
import type { DetectorService } from 'proton-pass-extension/app/content/services/form/detector';
import type { FormManager } from 'proton-pass-extension/app/content/services/form/manager';
import type { IFrameService } from 'proton-pass-extension/app/content/services/iframes/service';
import type { WebAuthNService } from 'proton-pass-extension/app/content/services/webauthn';
import type { ExtensionContextType } from 'proton-pass-extension/lib/context/extension-context';

import type { FeatureFlagState } from '@proton/pass/store/reducers';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import type { AppState, CurrentWebsiteExcludeRules, Maybe } from '@proton/pass/types';
import type { PassElementsConfig } from '@proton/pass/types/utils/dom';

export type CSContextState = AppState & { stale: boolean; ready: boolean };

export type CSFeatures =
    | 'Autofill'
    | 'Autofill2FA'
    | 'Autosave'
    | 'AutosuggestAlias'
    | 'AutosuggestPassword'
    | 'Passkeys';

export type CurrentWebsiteRules = { exclude?: CurrentWebsiteExcludeRules };
export interface ContentScriptContext {
    mainFrame: boolean;
    elements: PassElementsConfig;
    service: {
        autofill: AutofillService;
        autosave: AutosaveService;
        detector: DetectorService;
        formManager: FormManager;
        iframe: IFrameService;
        webauthn: Maybe<WebAuthNService>;
    };
    scriptId: string;
    destroy: (options: { reason: string; recycle?: boolean }) => void;
    getExtensionContext: () => ExtensionContextType;
    getFeatureFlags: () => FeatureFlagState;
    getFeatures: () => Record<CSFeatures, boolean>;
    getSettings: () => ProxiedSettings;
    getState: () => CSContextState;
    getWebsiteRules: () => Promise<CurrentWebsiteRules>;
    setFeatureFlags: (update: FeatureFlagState) => void;
    setSettings: (update: Partial<ProxiedSettings>) => void;
    setState: (update: Partial<CSContextState>) => void;
}
