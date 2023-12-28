import { type ForwardRefRenderFunction, forwardRef } from 'react';

import { AliasAutoSuggest } from 'proton-pass-extension/app/content/injections/apps/dropdown/views/AliasAutoSuggest';
import { ItemsList } from 'proton-pass-extension/app/content/injections/apps/dropdown/views/ItemsList';
import { PasswordAutoSuggest } from 'proton-pass-extension/app/content/injections/apps/dropdown/views/PasswordAutoSuggest';
import type { DropdownActions, IFrameCloseOptions, IFrameMessage } from 'proton-pass-extension/app/content/types';
import { DropdownAction } from 'proton-pass-extension/app/content/types';
import { useRequestFork } from 'proton-pass-extension/lib/hooks/useRequestFork';
import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import { clientBusy, clientErrored, clientLocked, clientUnauthorized } from '@proton/pass/lib/client';
import { contentScriptMessage, sendMessage } from '@proton/pass/lib/extension/message';
import type { MaybeNull , AppStatus} from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';
import { PassIconStatus } from '@proton/pass/types/data/pass-icon';
import { pipe, tap } from '@proton/pass/utils/fp/pipe';
import { FORK_TYPE } from '@proton/shared/lib/authentication/ForkInterface';
import { BRAND_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { DROPDOWN_ITEM_HEIGHT, DropdownItem } from './DropdownItem';
import { DropdownPinUnlock } from './DropdownPinUnlock';

type Props = {
    state: MaybeNull<DropdownActions>;
    status: AppStatus;
    loggedIn: boolean;
    visible?: boolean;
    onClose?: (options?: IFrameCloseOptions) => void;
    onMessage?: (message: IFrameMessage) => void;
    onReset?: () => void;
};

const DropdownSwitchRender: ForwardRefRenderFunction<HTMLDivElement, Props> = (
    { state, status, visible, onClose, onReset = noop, onMessage = noop },
    ref
) => {
    const accountFork = useRequestFork();
    const onMessageWithReset = pipe(onMessage, tap(onReset));

    return (
        <div
            ref={ref}
            className="min-h-custom bg-norm relative"
            style={{ '--min-h-custom': `${DROPDOWN_ITEM_HEIGHT}rem` }}
        >
            {(() => {
                if (state === null || clientBusy(status)) {
                    return <CircleLoader className="absolute inset-center m-auto" />;
                }

                if (clientLocked(status)) {
                    return <DropdownPinUnlock onUnlock={() => onClose?.({ refocus: true })} visible={visible} />;
                }

                if (clientErrored(status)) {
                    return (
                        <DropdownItem
                            onClick={() =>
                                sendMessage(
                                    contentScriptMessage({
                                        type: WorkerMessageType.AUTH_INIT,
                                        options: {
                                            retryable: false,
                                            forceLock: true,
                                        },
                                    })
                                )
                            }
                            title={c('Action').t`Sign back in`}
                            subTitle={
                                <span className="color-danger">{c('Warning')
                                    .t`Your session could not be resumed.`}</span>
                            }
                            icon={PassIconStatus.DISABLED}
                            autogrow
                        />
                    );
                }

                if (clientUnauthorized(status)) {
                    return (
                        <DropdownItem
                            onClick={async () => {
                                onClose?.();
                                await accountFork(FORK_TYPE.SWITCH);
                            }}
                            subTitle={c('Info').t`Enable ${PASS_APP_NAME} by connecting your ${BRAND_NAME} account`}
                            icon={PassIconStatus.DISABLED}
                            autogrow
                        />
                    );
                }

                switch (state.action) {
                    case DropdownAction.AUTOFILL:
                        return (
                            <ItemsList
                                hostname={state.hostname}
                                items={state.items}
                                needsUpgrade={state.needsUpgrade}
                                onMessage={onMessageWithReset}
                                onClose={onClose}
                                visible={visible}
                            />
                        );

                    case DropdownAction.AUTOSUGGEST_PASSWORD:
                        return (
                            <PasswordAutoSuggest
                                passwordOptions={state.options}
                                hostname={state.hostname}
                                onMessage={onMessage}
                                onClose={onClose}
                                visible={visible}
                            />
                        );

                    case DropdownAction.AUTOSUGGEST_ALIAS:
                        return (
                            <AliasAutoSuggest
                                prefix={state.prefix}
                                hostname={state.hostname}
                                onClose={onClose}
                                onMessage={onMessageWithReset}
                                visible={visible}
                            />
                        );
                }
            })()}
        </div>
    );
};

export const DropdownSwitch = forwardRef(DropdownSwitchRender);
