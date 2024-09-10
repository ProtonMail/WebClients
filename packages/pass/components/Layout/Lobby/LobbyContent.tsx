import { type FC, type ReactNode, useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button, CircleLoader } from '@proton/atoms';
import passBrandText from '@proton/pass/assets/protonpass-brand.svg';
import { useAuthStore } from '@proton/pass/components/Core/AuthStoreProvider';
import { useConnectivity } from '@proton/pass/components/Core/ConnectivityProvider';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { Card } from '@proton/pass/components/Layout/Card/Card';
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
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import './LobbyContent.scss';

const ERROR_TIMEOUT = 60_000;

type Props = {
    error?: string;
    status: AppStatus;
    warning?: string;
    onFork: () => void;
    onLogin: (options: AuthOptions) => void;
    onLogout: (options: { soft: boolean }) => void;
    onOffline: () => void;
    onRegister: () => void;
    renderError: (error: string) => ReactNode;
    renderFooter?: () => ReactNode;
    renderAccountSwitcher?: () => ReactNode;
};

export const LobbyContent: FC<Props> = ({
    error,
    status,
    warning,
    onFork,
    onLogin,
    onLogout,
    onOffline,
    onRegister,
    renderError,
    renderFooter,
    renderAccountSwitcher,
}) => {
    const { getOfflineEnabled } = usePassCore();
    const online = useConnectivity();
    const [criticalError, setCriticalError] = useState<Maybe<string>>(undefined);
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
        if (error) return setCriticalError(error);
        if (stale) {
            const staleErrorText = c('Warning')
                .t`Something went wrong while starting ${PASS_APP_NAME}. Please try refreshing or reloading the extension`;
            const timer = setTimeout(() => setCriticalError(staleErrorText), ERROR_TIMEOUT);
            return () => clearTimeout(timer);
        }
    }, [stale, error]);

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

    if (criticalError) return renderError(criticalError);

    if (busy) {
        return (
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
                            case AppStatus.ERROR:
                                return;
                            default:
                                return c('Info').jt`Sign in to your account`;
                        }
                    })()}
                </span>
            </div>

            {warning && (
                <Card type="danger" className={clsx('text-sm', EXTENSION_BUILD ? 'mt-4' : 'mt-6')}>
                    {warning}
                </Card>
            )}

            <div className={clsx('flex-1 flex flex-column gap-2 mt-6')}>
                {renderAccountSwitcher?.()}
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
                                    {errored ? c('Action').t`Retry` : c('Action').t`Sign in with ${BRAND_NAME}`}
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
