import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import { WorkerStatus } from '@proton/pass/types';

import { INITIAL_SETTINGS } from '../../shared/constants';
import { ExtensionContext } from '../../shared/extension';
import { createAutofillService } from '../services/form/autofill';
import { createAutosaveService } from '../services/form/autosave';
import { createDetectorService } from '../services/form/detector';
import { createFormManager } from '../services/form/manager';
import { createIFrameService } from '../services/iframes/service';
import { CSContext } from './context';
import type { CSContextState, ContentScriptContext } from './types';

export const createContentScriptContext = (options: {
    scriptId: string;
    mainFrame: boolean;
    destroy: (options: { reason: string }) => void;
}): ContentScriptContext => {
    const state: CSContextState = { active: true, loggedIn: false, status: WorkerStatus.IDLE, UID: undefined };
    const settings: ProxiedSettings = INITIAL_SETTINGS;

    const context: ContentScriptContext = CSContext.set({
        mainFrame: options.mainFrame,
        scriptId: options.scriptId,
        service: {
            formManager: createFormManager({
                /* attach or detach dropdown based on the
                 * detection results. If forms have been detected
                 * sync the autofillable items count */
                onDetection: (forms) => {
                    const didDetect = forms.length > 0;
                    context.service.iframe[didDetect ? 'attachDropdown' : 'detachDropdown']();
                },
            }),
            autofill: createAutofillService(),
            autosave: createAutosaveService(),
            iframe: createIFrameService(),
            detector: createDetectorService(),
        },
        getExtensionContext: () => ExtensionContext.get(),
        getState: () => state,
        setState: (update) => Object.assign(state, update),
        getSettings: () => settings,
        setSettings: (update) => Object.assign(settings, update),
        destroy: options.destroy,
    });

    return context;
};
