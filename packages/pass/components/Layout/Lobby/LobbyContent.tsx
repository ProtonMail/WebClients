import { type ReactNode, type VFC, useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button, CircleLoader } from '@proton/atoms';
import passBrandText from '@proton/pass/assets/protonpass-brand.svg';
import { Unlock } from '@proton/pass/components/Lock/Unlock';
import { clientBusy, clientErrored, clientLocked, clientStale } from '@proton/pass/lib/client';
import { AppStatus, type Maybe } from '@proton/pass/types';
import { BRAND_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';

import './LobbyContent.scss';

const ERROR_TIMEOUT = 15_000;

type Props = {
    status: AppStatus;
    onLogin: () => void;
    onLogout: (options: { soft: boolean }) => void;
    onRegister: () => void;
    renderError: () => ReactNode;
};

export const LobbyContent: VFC<Props> = ({ status, onLogin, onLogout, onRegister, renderError }) => {
    const [timeoutError, setTimeoutError] = useState(false);
    const stale = clientStale(status);
    const busy = clientBusy(status);
    const locked = clientLocked(status);
    const canSignOut = clientErrored(status) || locked;

    useEffect(() => {
        setTimeoutError(false);
        let timer: Maybe<NodeJS.Timeout> = stale ? setTimeout(() => setTimeoutError(true), ERROR_TIMEOUT) : undefined;
        return () => clearTimeout(timer);
    }, [stale]);

    const brandNameJSX = (
        <img
            src={passBrandText}
            className="pass-lobby--brand-text ml-2 h-custom"
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
                className="flex flex-column flex-align-items-center gap-3 mt-12 w-full anime-fade-in"
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
            <div className="flex flex-column flex-align-items-center gap-3">
                <span className="pass-lobby--heading text-bold text-norm flex flex-align-items-end justify-center user-select-none">
                    {locked ? c('Title').jt`Unlock ${brandNameJSX}` : c('Title').jt`Welcome to ${brandNameJSX}`}
                </span>
                <span className="text-norm">
                    {locked ? c('Info').jt`Enter your PIN code` : c('Info').jt`Sign in to your account`}
                </span>
            </div>

            <div className="flex-item-fluid mt-8 flex flex-column gap-2">
                {!locked && (
                    <Button pill shape="solid" color="norm" className="w-full" onClick={onLogin}>
                        {clientErrored(status)
                            ? c('Action').t`Sign back in`
                            : c('Action').t`Sign in with ${BRAND_NAME}`}
                    </Button>
                )}

                {!(locked || canSignOut) && (
                    <Button pill shape="solid" color="weak" className="w-full" onClick={onRegister}>
                        {c('Action').t`Create a ${BRAND_NAME} account`}
                    </Button>
                )}

                {locked && (
                    <div className="mb-8">
                        <Unlock />
                    </div>
                )}

                {canSignOut && (
                    <Button
                        pill
                        shape="outline"
                        color="danger"
                        className="w-full"
                        onClick={() => onLogout({ soft: true })}
                    >
                        {c('Action').t`Sign out`}
                    </Button>
                )}
            </div>
        </div>
    );
};
