import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import type { SelfAuditResult } from '@proton/key-transparency/interfaces';
import { getSelfAuditStatus } from '@proton/key-transparency/shared/selfAuditStatus';
import { KeyTransparencyActivation } from '@proton/shared/lib/interfaces/KeyTransparency';

interface State {
    value: KeyTransparencyActivation;
    /** Only set in the apps that register `ktSelfAuditListener` */
    selfAuditResult?: SelfAuditResult;
}

const name = 'kt' as const;

export interface KtState {
    [name]: State;
}

const defaultState: State = {
    value: KeyTransparencyActivation.DISABLED,
};

export const ktSlice = createSlice({
    name,
    initialState: defaultState,
    reducers: {
        value(state, action: PayloadAction<KeyTransparencyActivation>) {
            state.value = action.payload;
        },
        selfAuditResult(state, action: PayloadAction<SelfAuditResult>) {
            state.selfAuditResult = action.payload;
        },
    },
});

export const selectKTActivation = (state: KtState) => state.kt.value;
export const selectKTSelfAuditResult = (state: KtState) => state.kt.selfAuditResult;

/** What the last self-audit shows the user, only when KT is shown in the UI */
export const selectKTSelfAuditStatus = (state: KtState) => {
    const selfAuditResult = selectKTSelfAuditResult(state);
    if (selectKTActivation(state) !== KeyTransparencyActivation.SHOW_UI || !selfAuditResult) {
        return;
    }
    return getSelfAuditStatus(selfAuditResult);
};
