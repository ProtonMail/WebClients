import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import type { OnboardingState, PopupInitialState, WorkerState } from '@proton/pass/types';
import { WorkerStatus } from '@proton/pass/types';

export const INITIAL_ONBOARDING_STATE: OnboardingState = {
    installedOn: -1,
    updatedOn: -1,
    acknowledged: [],
};

export const INITIAL_WORKER_STATE: WorkerState = {
    loggedIn: false,
    status: WorkerStatus.IDLE,
    UID: undefined,
};

export const INITIAL_POPUP_STATE: PopupInitialState = {
    search: '',
    draft: null,
    filters: null,
    selectedItem: null,
    passwordOptions: null,
};

export const INITIAL_SETTINGS: ProxiedSettings = {
    autofill: { inject: true, openOnFocus: true },
    autosave: { prompt: true },
    autosuggest: { password: true, email: true },
    createdItemsCount: 0,
    loadDomainImages: true,
};
