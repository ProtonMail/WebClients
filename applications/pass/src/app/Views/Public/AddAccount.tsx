import type { FC } from 'react';
import { useHistory } from 'react-router-dom';

import { useAuthService } from 'proton-pass-web/app/Auth/AuthServiceProvider';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { useOnline } from '@proton/pass/components/Core/ConnectivityProvider';
import { LobbyLayout } from '@proton/pass/components/Layout/Lobby/LobbyLayout';
import { PublicRoutes, getOriginAccountHref, reloadHref } from '@proton/pass/components/Navigation/routing';
import { usePassConfig } from '@proton/pass/hooks/usePassConfig';
import { ForkType } from '@proton/shared/lib/authentication/fork/constants';
import { APPS, BRAND_NAME } from '@proton/shared/lib/constants';

/** Desktop only: lets the user pick how to sign in another account.
 * Nothing opens the browser until the browser option is chosen. */
export const AddAccount: FC = () => {
    const authService = useAuthService();
    const history = useHistory();
    const online = useOnline();
    const { SSO_URL } = usePassConfig();

    const signInWithBrowser = () =>
        history.push({ pathname: PublicRoutes.DeviceLogin, search: history.location.search });
    const signInInApp = () =>
        authService.requestFork({
            host: SSO_URL,
            app: APPS.PROTONPASS,
            forkType: ForkType.SWITCH,
            independent: true,
        });
    const goBack = () => reloadHref(getOriginAccountHref(history.location.search));

    return (
        <LobbyLayout>
            <div className="anime-fade-in flex flex-column h-full" style={{ '--anime-delay': '250ms' }}>
                <div className="flex flex-column items-center gap-3">
                    <span className="pass-lobby--heading w-full text-bold text-norm text-no-wrap flex flex-nowrap gap-2 items-end justify-center user-select-none">
                        {c('Title').t`Add an account`}
                    </span>
                    <span className="text-norm">{c('Info').t`Choose how you want to sign in`}</span>
                </div>

                <div className="flex-1 flex flex-column gap-2 mt-6">
                    <Button
                        pill
                        shape="solid"
                        color="norm"
                        className="w-full"
                        onClick={signInWithBrowser}
                        disabled={!online}
                    >
                        {c('Action').t`Sign in with ${BRAND_NAME}`}
                    </Button>
                    <Button pill shape="solid" color="weak" className="w-full" onClick={goBack}>
                        {c('Action').t`Go back`}
                    </Button>
                </div>

                <Button
                    pill
                    shape="ghost"
                    color="norm"
                    className="w-full mt-6"
                    onClick={signInInApp}
                    disabled={!online}
                >
                    {c('Action').t`Sign in in the app instead`}
                </Button>
            </div>
        </LobbyLayout>
    );
};
