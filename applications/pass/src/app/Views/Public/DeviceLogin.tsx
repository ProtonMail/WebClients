import type { FC } from 'react';
import { useHistory } from 'react-router-dom';

import { useAuthService } from 'proton-pass-web/app/Auth/AuthServiceProvider';
import { useDeviceLogin } from 'proton-pass-web/app/Auth/useDeviceLogin';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { IcChevronLeft } from '@proton/icons/icons/IcChevronLeft';
import { LobbyLayout } from '@proton/pass/components/Layout/Lobby/LobbyLayout';
import { getOriginAccountHref, reloadHref } from '@proton/pass/components/Navigation/routing';
import { usePassConfig } from '@proton/pass/hooks/usePassConfig';
import { ForkType } from '@proton/shared/lib/authentication/fork/constants';
import { APPS, PASS_APP_NAME } from '@proton/shared/lib/constants';

/** Full-page state of the desktop sign-in through the browser: the user
 * confirms in the browser, the app polls the fork until it is ready. */
export const DeviceLogin: FC = () => {
    const authService = useAuthService();
    const history = useHistory();
    const { SSO_URL } = usePassConfig();
    const { status, retry, reopen } = useDeviceLogin();

    const goBack = () => reloadHref(getOriginAccountHref(history.location.search));
    const signInInApp = () =>
        authService.requestFork({
            host: SSO_URL,
            app: APPS.PROTONPASS,
            forkType: ForkType.SWITCH,
            independent: true,
        });

    return (
        <LobbyLayout>
            <div className="flex flex-column items-center gap-4 mt-12">
                {status === 'waiting' && (
                    <>
                        <span className="text-bold text-lg">{c('Title').t`Continue in your browser`}</span>
                        <span className="text-weak">
                            {c('Info')
                                .t`Sign in and confirm in the browser window that just opened. ${PASS_APP_NAME} will pick up automatically once you're done.`}
                        </span>
                        <Button pill shape="outline" color="norm" onClick={reopen}>
                            {c('Action').t`Open the browser again`}
                        </Button>
                    </>
                )}

                {status === 'consuming' && (
                    <>
                        <CircleLoader size="medium" />
                        <span className="text-bold text-lg">{c('Title').t`Signing you in`}</span>
                    </>
                )}

                {(status === 'expired' || status === 'failed') && (
                    <>
                        <span className="text-bold text-lg">
                            {status === 'expired'
                                ? c('Title').t`Sign in timed out`
                                : c('Title').t`Something went wrong`}
                        </span>
                        <span className="text-weak">
                            {status === 'expired'
                                ? c('Info').t`The sign in was not confirmed in time.`
                                : c('Info').t`Your session could not be authorized.`}
                        </span>
                        <Button pill shape="solid" color="norm" onClick={retry}>
                            {c('Action').t`Try again`}
                        </Button>
                    </>
                )}

                {status !== 'consuming' && (
                    <>
                        <Button pill shape="ghost" color="weak" onClick={goBack}>
                            <IcChevronLeft className="mr-1" />
                            {c('Action').t`Go back`}
                        </Button>
                        <Button pill shape="ghost" color="weak" size="small" onClick={signInInApp}>
                            {c('Action').t`Sign in in the app instead`}
                        </Button>
                    </>
                )}
            </div>
        </LobbyLayout>
    );
};
