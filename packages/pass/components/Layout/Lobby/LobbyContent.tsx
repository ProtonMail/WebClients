import { type FC, type ReactNode, useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button, CircleLoader } from '@proton/atoms';
import passBrandText from '@proton/pass/assets/protonpass-brand.svg';
import { useConnectivity } from '@proton/pass/components/Core/ConnectivityProvider';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { PasswordUnlock } from '@proton/pass/components/Lock/PasswordUnlock';
import { PinUnlock } from '@proton/pass/components/Lock/PinUnlock';
import {
    clientBusy,
    clientErrored,
    clientPasswordLocked,
    clientSessionLocked,
    clientStale,
} from '@proton/pass/lib/client';
import { AppStatus, type Maybe } from '@proton/pass/types';
import { BRAND_NAME, PASS_APP_NAME, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import './LobbyContent.scss';

const ERROR_TIMEOUT = 60_000;

type Props = {
    status: AppStatus;
    onLogin: () => void;
    onLogout: (options: { soft: boolean }) => void;
    onOffline: () => void;
    onRegister: () => void;
    renderError: () => ReactNode;
    renderFooter?: () => ReactNode;
};

export const LobbyContent: FC<Props> = ({
    status,
    onLogin,
    onLogout,
    onOffline,
    onRegister,
    renderError,
    renderFooter,
}) => {
    const { getOfflineEnabled } = usePassCore();
    const online = useConnectivity();
    const [timeoutError, setTimeoutError] = useState(false);
    const [unlocking, setUnlocking] = useState(false);
    const [offlineEnabled, setOfflineEnabled] = useState<Maybe<boolean>>(undefined);

    const stale = clientStale(status);
    const locked = clientSessionLocked(status);
    const errored = clientErrored(status);
    const passwordLocked = clientPasswordLocked(status);
    const busy = clientBusy(status);
    const canSignOut = errored || locked || passwordLocked;

    useEffect(() => {
        setTimeoutError(false);
        let timer: Maybe<NodeJS.Timeout> = stale ? setTimeout(() => setTimeoutError(true), ERROR_TIMEOUT) : undefined;
        return () => clearTimeout(timer);
    }, [stale]);

    useEffect(() => {
        (async () => {
            const enabled = (await getOfflineEnabled?.()) ?? false;
            setOfflineEnabled(enabled);
        })().catch(noop);
    }, [online]);

    const brandNameJSX = (
        <img
            src={passBrandText}
            // we have margin on both sides because depending on the language this logo may be on the left or right
            className="pass-lobby--brand-text h-custom shrink-0 mx-2"
            style={{ '--h-custom': '1.5rem' }}
            key="brand"
            alt=""
        />
    );

    if (busy) {
        return timeoutError ? (
            <>{renderError()}</>
        ) : (
            <div
                key="lobby-loading"
                className="flex flex-column items-center gap-3 mt-12 w-full anime-fade-in"
                style={{ '--anime-delay': '250ms' }}
            >
                <CircleLoader size="medium" />
                <span className="block text-sm text-weak">
                    {(() => {
                        switch (status) {
                            case AppStatus.AUTHORIZED:
                            case AppStatus.AUTHORIZING:
                                // translator: status message displayed when loading
                                return c('Info').t`Signing you in`;
                            case AppStatus.BOOTING:
                                return c('Info').t`Decrypting your data`;
                            default:
                                return c('Info').t`Loading ${PASS_APP_NAME}`;
                        }
                    })()}
                </span>
            </div>
        );
    }

    return (
        <div key="lobby" className="anime-fade-in" style={{ '--anime-delay': '250ms' }}>
            <div className="flex flex-column items-center gap-3">
                <span className="pass-lobby--heading text-bold text-norm text-no-wrap flex flex-nowrap items-end justify-center user-select-none">
                    {locked || passwordLocked
                        ? c('lobby: Title').jt`Unlock ${brandNameJSX}`
                        : c('lobby: Title').jt`Welcome to ${brandNameJSX}`}
                </span>
                <span className="text-norm">
                    {(() => {
                        switch (status) {
                            case AppStatus.SESSION_LOCKED:
                                return c('lobby: Info').jt`Enter your PIN code`;
                            case AppStatus.PASSWORD_LOCKED:
                                return c('lobby: Info')
                                    .t`Unlock ${PASS_SHORT_APP_NAME} with your ${BRAND_NAME} password`;
                            default:
                                return c('lobby: Info').jt`Sign in to your account`;
                        }
                    })()}
                </span>
            </div>

            <div className="flex-1 mt-8 flex flex-column gap-2">
                {(() => {
                    switch (status) {
                        case AppStatus.SESSION_LOCKED:
                            return (
                                <div>
                                    <PinUnlock
                                        onLoading={setUnlocking}
                                        onOffline={onOffline}
                                        offlineEnabled={offlineEnabled}
                                    />
                                    {unlocking && <CircleLoader size="small" className="mt-4" />}
                                </div>
                            );
                        case AppStatus.PASSWORD_LOCKED:
                            return <PasswordUnlock offlineEnabled={offlineEnabled} />;
                        default:
                            return (
                                <Button
                                    pill
                                    shape="solid"
                                    color="norm"
                                    className="w-full"
                                    onClick={onLogin}
                                    disabled={!online && (errored || !offlineEnabled)}
                                >
                                    {errored ? c('Action').t`Sign back in` : c('Action').t`Sign in with ${BRAND_NAME}`}
                                </Button>
                            );
                    }
                })()}

                {!(busy || unlocking) &&
                    (canSignOut ? (
                        <Button
                            className="w-full"
                            color={'weak'}
                            onClick={() => onLogout({ soft: true })}
                            pill
                            shape="ghost"
                        >
                            {c('Action').t`Sign out`}
                        </Button>
                    ) : (
                        <Button
                            pill
                            shape="solid"
                            color="weak"
                            className="w-full"
                            onClick={onRegister}
                            disabled={!online}
                        >
                            {c('Action').t`Create a ${BRAND_NAME} account`}
                        </Button>
                    ))}
            </div>

            {renderFooter?.()}
        </div>
    );
};
