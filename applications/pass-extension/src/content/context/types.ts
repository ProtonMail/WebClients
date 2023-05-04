import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import type { WorkerState } from '@proton/pass/types';

import type { ExtensionContextType } from '../../shared/extension';
import type { CSAliasService } from '../services/alias';
import type { CSAutofillService } from '../services/autofill';
import type { DetectorService } from '../services/form/detector';
import type { FormManager } from '../services/form/manager';
import type { IFrameService } from '../services/iframes/service';

export type WorkerStateChangeHandler = (state: WorkerState) => void;
export type CSContextState = WorkerState & { active: boolean };

export interface ContentScriptContext {
    scriptId: string;
    mainFrame: boolean;
    service: {
        formManager: FormManager;
        autofill: CSAutofillService;
        alias: CSAliasService;
        iframe: IFrameService;
        detector: DetectorService;
    };
    getState: () => CSContextState;
    setState: (update: Partial<CSContextState>) => void;
    getSettings: () => ProxiedSettings;
    setSettings: (update: Partial<ProxiedSettings>) => void;
    getExtensionContext: () => ExtensionContextType;
}
