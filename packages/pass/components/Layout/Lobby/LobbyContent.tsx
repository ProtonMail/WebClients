import { type FC, type ReactNode, useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button, CircleLoader } from '@proton/atoms';
import { useOnline } from '@proton/components/hooks';
import passBrandText from '@proton/pass/assets/protonpass-brand.svg';
import { OfflineUnlock } from '@proton/pass/components/Lock/OfflineUnlock';
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

import './LobbyContent.scss';

const ERROR_TIMEOUT = 60_000;

type Props = {
    status: AppStatus;
    onLogin: () => void;
    onLogout: (options: { soft: boolean }) => void;
    onRegister: () => void;
    renderError: () => ReactNode;
    renderFooter?: () => ReactNode;
};

export const LobbyContent: FC<Props> = ({ status, onLogin, onLogout, onRegister, renderError, renderFooter }) => {
    const [timeoutError, setTimeoutError] = useState(false);
    const [unlocking, setUnlocking] = useState(false);

    const stale = clientStale(status);
    const locked = clientSessionLocked(status);
    const errored = clientErrored(status);
    const passwordLocked = clientPasswordLocked(status);
    const busy = clientBusy(status);
    const canSignOut = errored || locked || passwordLocked;
    const navigatorOnline = useOnline();

    useEffect(() => {
        setTimeoutError(false);
        let timer: Maybe<NodeJS.Timeout> = stale ? setTimeout(() => setTimeoutError(true), ERROR_TIMEOUT) : undefined;
        return () => clearTimeout(timer);
    }, [stale]);

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
                                    .t`You are currently offline. Unlock ${PASS_SHORT_APP_NAME} with your ${BRAND_NAME} password`;
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
                                <div className="mb-8">
                                    <PinUnlock onLoading={setUnlocking} />
                                    {unlocking && <CircleLoader size="small" className="mt-12" />}
                                </div>
                            );
                        case AppStatus.PASSWORD_LOCKED:
                            return <OfflineUnlock />;
                        default:
                            return (
                                <Button
                                    pill
                                    shape="solid"
                                    color="norm"
                                    className="w-full"
                                    onClick={onLogin}
                                    disabled={errored ? false : !navigatorOnline}
                                >
                                    {errored ? c('Action').t`Sign back in` : c('Action').t`Sign in with ${BRAND_NAME}`}
                                </Button>
                            );
                    }
                })()}

                {!(busy || unlocking) ? (
                    canSignOut ? (
                        <Button
                            className="w-full"
                            color={'weak'}
                            onClick={() => onLogout({ soft: true })}
                            pill
                            shape={'ghost'}
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
                            disabled={!navigatorOnline}
                        >
                            {c('Action').t`Create a ${BRAND_NAME} account`}
                        </Button>
                    )
                ) : null}
            </div>

            {renderFooter?.()}
        </div>
    );
};
