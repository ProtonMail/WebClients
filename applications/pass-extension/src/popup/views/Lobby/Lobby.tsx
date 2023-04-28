import { type VFC, useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button, CircleLoader } from '@proton/atoms';
import { popupMessage, sendMessage } from '@proton/pass/extension/message';
import { type Maybe, WorkerMessageType, WorkerStatus } from '@proton/pass/types';
import { workerBusy, workerErrored, workerStale } from '@proton/pass/utils/worker';
import { FORK_TYPE } from '@proton/shared/lib/authentication/ForkInterface';
import { BRAND_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';

import passBrandText from '../../../../public/assets/protonpass-brand.svg';
import { FadeIn } from '../../../shared/components/animation/FadeIn';
import { useNavigateToLogin } from '../../../shared/hooks';
import { PromptForReload } from '../../components/ExtensionError';
import { usePopupContext } from '../../hooks/usePopupContext';
import { LobbyLayout } from './LobbyLayout';
import { Unlock } from './Unlock';

const PROMPT_FOR_RELOAD_TIMEOUT = 10000;

const LobbyContent: VFC = () => {
    const { state, logout } = usePopupContext();
    const [promptForReload, setPromptForReload] = useState(false);
    const stale = workerStale(state.status);
    const busy = workerBusy(state.status);
    const locked = state.status === WorkerStatus.LOCKED;
    const canSignOut = workerErrored(state.status) || locked;

    const login = useNavigateToLogin({ autoClose: true });

    const handleSignInClick = useCallback(
        async () =>
            workerErrored(state.status)
                ? sendMessage(popupMessage({ type: WorkerMessageType.WORKER_INIT, payload: { sync: true } }))
                : login(FORK_TYPE.SWITCH),
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
            style={{ '--height-custom': '24px' }}
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
            <FadeIn delay={250} className="mt-12 w100" key="lobby-loading">
                <div className="flex flex-column flex-align-items-center gap-3">
                    <CircleLoader size="medium" />
                    <span className="block text-sm text-weak">
                        {(() => {
                            switch (state.status) {
                                case WorkerStatus.AUTHORIZED:
                                case WorkerStatus.AUTHORIZING:
                                case WorkerStatus.RESUMING:
                                    return c('Info').t`Signing you in`;
                                case WorkerStatus.BOOTING:
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
                    <Button pill shape="solid" color="norm" className="w100" onClick={handleSignInClick}>
                        {workerErrored(state.status)
                            ? c('Action').t`Sign back in`
                            : c('Action').t`Sign in with ${BRAND_NAME}`}
                    </Button>
                )}

                {!(locked || canSignOut) && (
                    <Button pill shape="solid" color="weak" className="w100" onClick={handleSignUpClick}>
                        {c('Action').t`Create a ${BRAND_NAME} account`}
                    </Button>
                )}

                {locked && (
                    <div className="mb-8">
                        <Unlock />
                    </div>
                )}

                {canSignOut && (
                    <Button pill shape="outline" color="danger" className="w100" onClick={() => logout({ soft: true })}>
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
