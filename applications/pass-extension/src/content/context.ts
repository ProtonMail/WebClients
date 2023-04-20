import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import type { WorkerState } from '@proton/pass/types';
import { createSharedContext } from '@proton/pass/utils/context';

import { FormManager } from './services/form/manager';
import { InjectedDropdown, InjectedNotification } from './types';

export type WorkerStateChangeHandler = (state: WorkerState) => void;
export interface ContentScriptContext {
    id: string;
    active: boolean;
    state: WorkerState;
    settings: ProxiedSettings;
    iframes: { dropdown: InjectedDropdown; notification: InjectedNotification | null };
    formManager: FormManager;
}

const CSContext = createSharedContext<ContentScriptContext>('content-script');

export default CSContext;
