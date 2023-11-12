import { type VFC, useCallback, useEffect, useState } from 'react';

import { PromptForReload } from 'proton-pass-extension/lib/components/Extension/ExtensionError';
import { useNavigateToLogin } from 'proton-pass-extension/lib/hooks/useNavigateToLogin';
import { usePopupContext } from 'proton-pass-extension/lib/hooks/usePopupContext';
import { c } from 'ttag';

import { Button, CircleLoader } from '@proton/atoms';
import passBrandText from '@proton/pass/assets/protonpass-brand.svg';
import { FadeIn } from '@proton/pass/components/Layout/Animation/FadeIn';
import { LobbyLayout } from '@proton/pass/components/Layout/Lobby/LobbyLayout';
import { Unlock } from '@proton/pass/components/Lock/Unlock';
import { clientBusy, clientErrored, clientStale } from '@proton/pass/lib/client';
import { popupMessage, sendMessage } from '@proton/pass/lib/extension/message';
import { AppStatus, type Maybe, WorkerMessageType } from '@proton/pass/types';
import { FORK_TYPE } from '@proton/shared/lib/authentication/ForkInterface';
import { BRAND_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';

const PROMPT_FOR_RELOAD_TIMEOUT = 10000;

const LobbyContent: VFC = () => {
    const { state, logout } = usePopupContext();
    const [promptForReload, setPromptForReload] = useState(false);
    const stale = clientStale(state.status);
    const busy = clientBusy(state.status);
    const locked = state.status === AppStatus.LOCKED;
    const canSignOut = clientErrored(state.status) || locked;

    const login = useNavigateToLogin({ autoClose: true });

    const handleSignInClick = useCallback(
        async () =>
            clientErrored(state.status) ? sendMessage(popupMessage({ type: WorkerMessageType.WORKER_INIT })) : login(),
        [state.status]
    );

    const handleSignUpClick = useCallback(async () => login(FORK_TYPE.SIGNUP), []);

    useEffect(() => {
        let timer: Maybe<NodeJS.Timeout> = stale
            ? setTimeout(() => setPromptForReload(true), PROMPT_FOR_RELOAD_TIMEOUT)
            : undefined;
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
        return promptForReload ? (
            <PromptForReload
                message={c('Warning')
                    .t`Something went wrong while starting ${PASS_APP_NAME}. Please try refreshing or reloading the extension`}
            />
        ) : (
            <FadeIn delay={250} className="mt-12 w-full" key="lobby-loading">
                <div className="flex flex-column flex-align-items-center gap-3">
                    <CircleLoader size="medium" />
                    <span className="block text-sm text-weak">
                        {(() => {
                            switch (state.status) {
                                case AppStatus.AUTHORIZED:
                                case AppStatus.AUTHORIZING:
                                case AppStatus.RESUMING:
                                    // translator: status message displayed when loading
                                    return c('Info').t`Signing you in`;
                                case AppStatus.BOOTING:
                                    return c('Info').t`Decrypting your data`;
                                default:
                                    return c('Info').t`Loading extension`;
                            }
                        })()}
                    </span>
                </div>
            </FadeIn>
        );
    }

    return (
        <FadeIn delay={250} key="lobby">
            <div className="flex flex-column flex-align-items-center gap-3">
                <span className="pass-lobby--heading text-bold text-norm flex flex-align-items-center flex-justify-center user-select-none">
                    {locked ? c('Title').jt`Unlock ${brandNameJSX}` : c('Title').jt`Welcome to ${brandNameJSX}`}
                </span>
                <span className="text-norm">
                    {locked ? c('Info').jt`Enter your PIN code` : c('Info').jt`Sign in to your account`}
                </span>
            </div>

            <div className="flex-item-fluid mt-8 flex flex-column gap-2">
                {!locked && (
                    <Button pill shape="solid" color="norm" className="w-full" onClick={handleSignInClick}>
                        {clientErrored(state.status)
                            ? c('Action').t`Sign back in`
                            : c('Action').t`Sign in with ${BRAND_NAME}`}
                    </Button>
                )}

                {!(locked || canSignOut) && (
                    <Button pill shape="solid" color="weak" className="w-full" onClick={handleSignUpClick}>
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
                        onClick={() => logout({ soft: true })}
                    >
                        {c('Action').t`Sign out`}
                    </Button>
                )}
            </div>
        </FadeIn>
    );
};

export const Lobby: VFC = () => (
    <LobbyLayout overlay>
        <LobbyContent />
    </LobbyLayout>
);
