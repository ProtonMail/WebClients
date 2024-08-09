import { type FC, type ReactNode, useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button, CircleLoader } from '@proton/atoms';
import passBrandText from '@proton/pass/assets/protonpass-brand.svg';
import { useAuthStore } from '@proton/pass/components/Core/AuthStoreProvider';
import { useConnectivity } from '@proton/pass/components/Core/ConnectivityProvider';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { LockOnboarding } from '@proton/pass/components/Layout/Lobby/LockOnboarding';
import { BiometricsUnlock } from '@proton/pass/components/Lock/BiometricsUnlock';
import { PasswordConfirm } from '@proton/pass/components/Lock/PasswordConfirm';
import { PasswordUnlock } from '@proton/pass/components/Lock/PasswordUnlock';
import { PinUnlock } from '@proton/pass/components/Lock/PinUnlock';
import { PasswordVerification } from '@proton/pass/lib/auth/password';
import type { AuthOptions } from '@proton/pass/lib/auth/service';
import {
    clientBusy,
    clientErrored,
    clientMissingScope,
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
    error?: string;
    status: AppStatus;
    onFork: () => void;
    onLogin: (options: AuthOptions) => void;
    onLogout: (options: { soft: boolean }) => void;
    onOffline: () => void;
    onRegister: () => void;
    renderError: () => ReactNode;
    renderFooter?: () => ReactNode;
    setAppStatus: (status: AppStatus) => void;
};

export const LobbyContent: FC<Props> = ({
    error,
    status,
    onFork,
    onLogin,
    onLogout,
    onOffline,
    onRegister,
    renderError,
    renderFooter,
    setAppStatus,
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
    const missingScope = clientMissingScope(status);
    const busy = clientBusy(status);
    const canSignOut = errored || locked || passwordLocked || missingScope;
    const hasExtraPassword = Boolean(useAuthStore()?.getExtraPassword());

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

    if (status === AppStatus.LOCK_SETUP) {
        return (
            <>
                <LockOnboarding setAppStatus={setAppStatus} />
                <Button
                    className="w-full text-sm mt-6"
                    color="weak"
                    onClick={() => onLogout({ soft: true })}
                    pill
                    shape="ghost"
                >
                    {c('Action').t`Sign out`}
                </Button>
            </>
        );
    }

    return (
        <div key="lobby" className="anime-fade-in" style={{ '--anime-delay': '250ms' }}>
            <div className="flex flex-column items-center gap-3">
                <span className="pass-lobby--heading text-bold text-norm text-no-wrap flex flex-nowrap items-end justify-center user-select-none">
                    {locked || passwordLocked || missingScope
                        ? c('Title').jt`Unlock ${brandNameJSX}`
                        : c('Title').jt`Welcome to ${brandNameJSX}`}
                </span>
                <span className="text-norm">
                    {(() => {
                        switch (status) {
                            case AppStatus.SESSION_LOCKED:
                                return c('Info').jt`Enter your PIN code`;
                            case AppStatus.PASSWORD_LOCKED:
                                return hasExtraPassword
                                    ? c('Info').t`Unlock ${PASS_SHORT_APP_NAME} with your extra password`
                                    : c('Info').t`Unlock ${PASS_SHORT_APP_NAME} with your ${BRAND_NAME} password`;
                            case AppStatus.BIOMETRICS_LOCKED:
                                return c('Info').t`Unlock ${PASS_SHORT_APP_NAME} with biometrics`;
                            case AppStatus.MISSING_SCOPE:
                                return c('Info').t`Enter your extra password`;
                            default:
                                return c('Info').jt`Sign in to your account`;
                        }
                    })()}
                </span>
            </div>

            {error && (
                <Card type="danger" className="mt-6 text-sm">
                    {error}
                </Card>
            )}

            <div className="flex-1 mt-8 flex flex-column gap-2">
                {(() => {
                    switch (status) {
                        case AppStatus.MISSING_SCOPE:
                            return (
                                <PasswordConfirm
                                    mode={PasswordVerification.EXTRA_PASSWORD}
                                    onSuccess={() => onLogin({ forceLock: false })}
                                />
                            );

                        case AppStatus.SESSION_LOCKED:
                            return (
                                <PinUnlock
                                    onLoading={setUnlocking}
                                    onOffline={onOffline}
                                    offlineEnabled={offlineEnabled}
                                />
                            );

                        case AppStatus.PASSWORD_LOCKED:
                            return <PasswordUnlock offlineEnabled={offlineEnabled} extraPassword={hasExtraPassword} />;

                        case AppStatus.BIOMETRICS_LOCKED:
                            return <BiometricsUnlock offlineEnabled={offlineEnabled} />;

                        default:
                            return (
                                <Button
                                    pill
                                    shape="solid"
                                    color="norm"
                                    className="w-full"
                                    onClick={() => (errored ? onLogin({ forceLock: true }) : onFork())}
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
