import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { sshAgent } from 'proton-pass-web/lib/ssh-agent';

import {
    getUserAccessSuccess,
    getUserFeaturesSuccess,
    sharesDedupeUpdate,
    stateDestroy,
} from '@proton/pass/store/actions';
import { selectFeatureFlag, selectPassPlan } from '@proton/pass/store/selectors/user';
import type { State } from '@proton/pass/store/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { UserPassPlan } from '@proton/pass/types/api/plan';

const sshAgentListener = createListenerMiddleware<State>();

/** Clear SSH keys on logout/lock etc */
sshAgentListener.startListening({
    actionCreator: stateDestroy,
    effect: () => {
        void sshAgent?.clear();
    },
});

/** Sync SSH keys when vault visibility changes. Toggling a vault hidden/visible
 * will update the SSH keys returned by `selectVisibleNonTrashedSshKeyItems` */
sshAgentListener.startListening({
    actionCreator: sharesDedupeUpdate,
    effect: () => {
        void sshAgent?.sync();
    },
});

/** Stop agent on plan downgrade or flag disabled */
sshAgentListener.startListening({
    matcher: isAnyOf(getUserAccessSuccess, getUserFeaturesSuccess),
    effect: (_, { getState }) => {
        if (!sshAgent?.enabled) return;
        const state = getState();
        const plan = selectPassPlan(state);
        const featureEnabled = selectFeatureFlag(PassFeature.PassDesktopSSHAgent)(state);
        if (plan === UserPassPlan.FREE || !featureEnabled) void sshAgent.destroy();
    },
});

export const sshAgentMiddleware = sshAgentListener.middleware;
