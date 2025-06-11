import type { AutofillService } from 'proton-pass-extension/app/content/services/autofill/autofill';
import type { AutosaveService } from 'proton-pass-extension/app/content/services/autosave/autosave.abstract';
import type { DetectorService } from 'proton-pass-extension/app/content/services/form/detector';
import type { FormManager } from 'proton-pass-extension/app/content/services/form/manager';
import type { AbstractInlineService } from 'proton-pass-extension/app/content/services/inline/inline.abstract';
import type { WebAuthNService } from 'proton-pass-extension/app/content/services/webauthn';
import type { FrameMessageBroker } from 'proton-pass-extension/app/content/utils/frame.message-broker';
import type { ExtensionContextType } from 'proton-pass-extension/lib/context/extension-context';

import type { FeatureFlagState } from '@proton/pass/store/reducers';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import type { AppState, Maybe } from '@proton/pass/types';
import type { PassElementsConfig } from '@proton/pass/types/utils/dom';

export type CSContextState = AppState & { stale: boolean; ready: boolean };

export type CSFeatures =
    | 'Autofill'
    | 'Autofill2FA'
    | 'Autosave'
    | 'AutosuggestAlias'
    | 'AutosuggestPassword'
    | 'Passkeys';

export interface ContentScriptContext {
    /** Wether this script is in the top-frame */
    mainFrame: boolean;
    /** Random identifier for the current content-script */
    scriptId: string;
    /** Custom elements configuration */
    elements: PassElementsConfig;
    transport: FrameMessageBroker;

    service: {
        autofill: AutofillService;
        autosave: AutosaveService;
        detector: DetectorService;
        formManager: FormManager;
        inline: AbstractInlineService;
        webauthn: Maybe<WebAuthNService>;
    };

    destroy: (options: { reason: string; recycle?: boolean }) => void;
    getExtensionContext: () => Maybe<ExtensionContextType>;
    getFeatureFlags: () => FeatureFlagState;
    getFeatures: () => Record<CSFeatures, boolean>;
    getSettings: () => ProxiedSettings;
    getState: () => CSContextState;
    setFeatureFlags: (update: FeatureFlagState) => void;
    setSettings: (update: Partial<ProxiedSettings>) => void;
    setState: (update: Partial<CSContextState>) => void;
}
