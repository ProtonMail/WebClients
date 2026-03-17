import { useCallback, useEffect } from 'react';
import { useStore } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { useRequestFork } from 'proton-pass-extension/lib/hooks/useRequestFork';

import type { OnReauthFn } from '@proton/pass/components/Lock/PasswordUnlockProvider';
import { useReauthActionHandler } from '@proton/pass/hooks/auth/useReauthActionHandler';
import type { RequestForkData } from '@proton/pass/lib/auth/fork';
import { getStateKey, isReauthForkState } from '@proton/pass/lib/auth/fork';
import { ReauthAction } from '@proton/pass/lib/auth/reauth';
import browser from '@proton/pass/lib/globals/browser';
import { selectUser } from '@proton/pass/store/selectors/user';
import type { State } from '@proton/pass/store/types';

export const useExtensionReauth = () => {
    const history = useHistory();
    const store = useStore<State>();
    const requestFork = useRequestFork();
    const handleReauthAction = useReauthActionHandler(store);

    useEffect(() => {
        void (async () => {
            const params = new URLSearchParams(history.location.search);
            const state = params.get('state');
            if (!state) return;

            history.replace({ ...history.location, search: '' });
            const stateKey = getStateKey(state);

            const stateData = (await browser.storage.session.get(stateKey))?.[stateKey];
            await browser.storage.session.remove([stateKey]);

            if (typeof stateData !== 'string') return;
            const data = JSON.parse(stateData);

            if (isReauthForkState(data)) return handleReauthAction(data.reauth);
        })();
    }, []);

    return useCallback<OnReauthFn>((reauth, fork) => {
        if (![ReauthAction.EXPORT_CONFIRM, ReauthAction.OFFLINE_SETUP].includes(reauth.type)) return;

        const user = selectUser(store.getState());
        const userID = user?.ID;
        const email = user?.Email;
        const data: RequestForkData = { type: 'reauth', userID, reauth };
        return requestFork({ ...fork, data, email, replace: true });
    }, []);
};
