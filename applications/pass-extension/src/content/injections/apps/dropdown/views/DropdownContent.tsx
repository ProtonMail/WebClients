import { type VFC, useCallback, useLayoutEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import { type Callback, type MaybeNull, WorkerStatus } from '@proton/pass/types';
import { pixelEncoder } from '@proton/pass/utils/dom';
import { pipe, tap } from '@proton/pass/utils/fp';
import { FORK_TYPE } from '@proton/shared/lib/authentication/ForkInterface';
import { BRAND_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';

import { useAccountFork } from '../../../../../shared/hooks';
import {
    DropdownAction,
    type DropdownSetActionPayload,
    type IFrameMessage,
    IFrameMessageType,
} from '../../../../types';
import { useIFrameContext, useRegisterMessageHandler } from '../../context/IFrameContextProvider';
import { DropdownItem } from '../components/DropdownItem';
import { AliasAutoSuggest } from './AliasAutoSuggest';
import { ItemsList } from './ItemsList';
import { PasswordAutoSuggest } from './PasswordAutoSuggest';

export const DropdownContent: VFC = () => {
    const { workerState, resizeIFrame, closeIFrame, postMessage } = useIFrameContext();
    const [dropdownState, setDropdownState] = useState<MaybeNull<DropdownSetActionPayload>>(null);

    const withStateReset = <F extends Callback>(fn: F): F =>
        pipe(
            fn,
            tap(() => setDropdownState(null))
        ) as F;

    const dropdownRef = useRef<HTMLDivElement>(null);
    const accountFork = useAccountFork();

    const handleAction = useCallback(
        ({ payload }: IFrameMessage<IFrameMessageType.DROPDOWN_ACTION>) => setDropdownState(payload),
        []
    );

    const triggerResize = useCallback(() => resizeIFrame(dropdownRef.current), [resizeIFrame]);
    useLayoutEffect(() => triggerResize(), [triggerResize, dropdownState, workerState]);

    useRegisterMessageHandler(IFrameMessageType.DROPDOWN_ACTION, handleAction);
    useRegisterMessageHandler(IFrameMessageType.IFRAME_OPEN, triggerResize);

    return (
        <div ref={dropdownRef} className="min-h-custom bg-norm" style={{ '--min-height-custom': pixelEncoder(60) }}>
            {(() => {
                if (workerState === undefined || dropdownState === null) {
                    return <CircleLoader className="absolute absolute-center m-auto" />;
                }

                const { loggedIn, status } = workerState;
                const { action } = dropdownState;

                if (status === WorkerStatus.LOCKED) {
                    return (
                        <DropdownItem
                            onClick={closeIFrame}
                            title={c('Title').t`${PASS_APP_NAME} locked`}
                            subTitle={c('Info').t`Unlock with your pin`}
                            icon="lock-filled"
                        />
                    );
                }

                if (!loggedIn) {
                    return (
                        <DropdownItem
                            onClick={async () => {
                                closeIFrame();
                                await accountFork(FORK_TYPE.SWITCH);
                            }}
                            title={PASS_APP_NAME}
                            subTitle={c('Info').t`Login with your ${BRAND_NAME} account`}
                        />
                    );
                }

                switch (action) {
                    case DropdownAction.AUTOFILL:
                        return dropdownState.items.length > 0 ? (
                            <ItemsList
                                items={dropdownState.items}
                                needsUpgrade={dropdownState.needsUpgrade}
                                onSubmit={withStateReset((item) =>
                                    postMessage({
                                        type: IFrameMessageType.DROPDOWN_AUTOFILL_LOGIN,
                                        payload: { item },
                                    })
                                )}
                            />
                        ) : (
                            <DropdownItem
                                onClick={withStateReset(closeIFrame)}
                                title={PASS_APP_NAME}
                                subTitle={c('Info').t`No login found`}
                                disabled
                            />
                        );

                    case DropdownAction.AUTOSUGGEST_PASSWORD:
                        return (
                            <PasswordAutoSuggest
                                onSubmit={withStateReset((password) =>
                                    postMessage({
                                        type: IFrameMessageType.DROPDOWN_AUTOSUGGEST_PASSWORD,
                                        payload: { password },
                                    })
                                )}
                            />
                        );

                    case DropdownAction.AUTOSUGGEST_ALIAS:
                        return (
                            <AliasAutoSuggest
                                prefix={dropdownState.prefix}
                                domain={dropdownState.domain}
                                onOptions={triggerResize}
                                onSubmit={withStateReset((aliasEmail) => {
                                    postMessage({
                                        type: IFrameMessageType.DROPDOWN_AUTOSUGGEST_ALIAS,
                                        payload: { aliasEmail },
                                    });
                                })}
                            />
                        );
                }
            })()}
        </div>
    );
};
