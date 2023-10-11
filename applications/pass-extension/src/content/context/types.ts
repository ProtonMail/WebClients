import type { FeatureFlagState } from '@proton/pass/store/reducers';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import type { WorkerState } from '@proton/pass/types';

import type { ExtensionContextType } from '../../shared/extension';
import type { AutofillService } from '../services/form/autofill';
import type { AutosaveService } from '../services/form/autosave';
import type { DetectorService } from '../services/form/detector';
import type { FormManager } from '../services/form/manager';
import type { IFrameService } from '../services/iframes/service';

export type WorkerStateChangeHandler = (state: WorkerState) => void;
export type CSContextState = WorkerState & { active: boolean };
export type CSFeatures = 'Autofill' | 'Autofill2FA' | 'AutosuggestAlias' | 'AutosuggestPassword' | 'Autosave';
export interface ContentScriptContext {
    mainFrame: boolean;
    service: {
        autofill: AutofillService;
        autosave: AutosaveService;
        detector: DetectorService;
        formManager: FormManager;
        iframe: IFrameService;
    };
    scriptId: string;
    destroy: (options: { reason: string; recycle?: boolean }) => void;
    getExtensionContext: () => ExtensionContextType;
    getFeatureFlags: () => FeatureFlagState;
    getFeatures: () => Record<CSFeatures, boolean>;
    getSettings: () => ProxiedSettings;
    getState: () => CSContextState;
    setFeatureFlags: (update: FeatureFlagState) => void;
    setSettings: (update: Partial<ProxiedSettings>) => void;
    setState: (update: Partial<CSContextState>) => void;
}
