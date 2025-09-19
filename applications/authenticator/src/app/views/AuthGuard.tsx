import { type FC, type PropsWithChildren, useEffect } from 'react';

import { listen } from '@tauri-apps/api/event';
import { ErrorScreen } from 'proton-authenticator/app/views/ErrorScreen';
import { apiEvents } from 'proton-authenticator/lib/api';
import { abortLogin, executeLogin, logout } from 'proton-authenticator/store/auth';
import { useAppDispatch, useAppSelector } from 'proton-authenticator/store/utils';

import { CircleLoader } from '@proton/atoms';
import useEffectOnce from '@proton/hooks/useEffectOnce';
import { prop } from '@proton/pass/utils/fp/lens';
import { getConsumeForkParameters } from '@proton/shared/lib/authentication/fork';
import noop from '@proton/utils/noop';

import { UnlockScreen } from './UnlockScreen';

export const AuthGuard: FC<PropsWithChildren> = ({ children }) => {
    const { status } = useAppSelector(prop('app'));
    const { appLock } = useAppSelector(prop('settings'));
    const dispatch = useAppDispatch();

    useEffectOnce(() => {
        let unlisten: () => void = noop;

        (async () => {
            const unlisteners = await Promise.all([
                listen('authenticator:login:destroyed', () => dispatch(abortLogin())),
                listen('authenticator:login', async (e: { payload: string }) => {
                    const { payload } = e;
                    const searchParams = new URLSearchParams(payload);
                    const params = getConsumeForkParameters(searchParams);
                    if (!params) return;
                    await dispatch(executeLogin(params));
                }),
            ]);

            unlisten = () => unlisteners.forEach((unlisten) => unlisten());
        })().catch(noop);

        return unlisten;
    }, []);

    useEffect(
        () =>
            apiEvents.subscribe((event) => {
                switch (event.type) {
                    case 'logout':
                    case 'missing-scopes':
                        void dispatch(logout({ soft: true }));
                        break;
                }
            }),
        []
    );

    return (() => {
        switch (status) {
            case 'ready':
                return children;
            case 'locked':
                return <UnlockScreen lockMode={appLock} />;
            case 'error':
                return <ErrorScreen />;

            default:
                return (
                    <div className="flex h-full w-full justify-center items-center">
                        <CircleLoader />
                    </div>
                );
        }
    })();
};
