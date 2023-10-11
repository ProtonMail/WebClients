import { type ForwardRefRenderFunction, forwardRef } from 'react';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import { workerBusy } from '@proton/pass/lib/worker';
import type { MaybeNull } from '@proton/pass/types';
import { WorkerStatus } from '@proton/pass/types';
import { PassIconStatus } from '@proton/pass/types/data/pass-icon';
import { pixelEncoder } from '@proton/pass/utils/dom';
import { pipe, tap } from '@proton/pass/utils/fp';
import { FORK_TYPE } from '@proton/shared/lib/authentication/ForkInterface';
import { BRAND_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import type { IFrameCloseOptions, IFrameMessage } from '../../../../../content/types';
import { DropdownAction, type DropdownActions } from '../../../../../content/types';
import { useAccountFork } from '../../../../../shared/hooks';
import { AliasAutoSuggest } from '../views/AliasAutoSuggest';
import { ItemsList } from '../views/ItemsList';
import { PasswordAutoSuggest } from '../views/PasswordAutoSuggest';
import { DROPDOWN_ITEM_HEIGHT, DropdownItem } from './DropdownItem';
import { DropdownPinUnlock } from './DropdownPinUnlock';

type Props = {
    state: MaybeNull<DropdownActions>;
    status: WorkerStatus;
    loggedIn: boolean;
    visible?: boolean;
    onClose?: (options?: IFrameCloseOptions) => void;
    onMessage?: (message: IFrameMessage) => void;
    onReset?: () => void;
};

const DropdownSwitchRender: ForwardRefRenderFunction<HTMLDivElement, Props> = (
    { state, loggedIn, status, visible, onClose, onReset = noop, onMessage = noop },
    ref
) => {
    const accountFork = useAccountFork();
    const onMessageWithReset = pipe(onMessage, tap(onReset));

    return (
        <div
            ref={ref}
            className="min-h-custom bg-norm relative"
            style={{ '--min-h-custom': pixelEncoder(DROPDOWN_ITEM_HEIGHT) }}
        >
            {(() => {
                if (state === null || workerBusy(status)) {
                    return <CircleLoader className="absolute-center m-auto" />;
                }

                if (status === WorkerStatus.LOCKED) {
                    return <DropdownPinUnlock onUnlock={() => onClose?.({ refocus: true })} visible={visible} />;
                }

                if (!loggedIn) {
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
                                items={state.items}
                                needsUpgrade={state.needsUpgrade}
                                onMessage={onMessageWithReset}
                                onClose={onClose}
                                visible={visible}
                            />
                        );

                    case DropdownAction.AUTOSUGGEST_PASSWORD:
                        return <PasswordAutoSuggest onMessage={onMessage} onClose={onClose} visible={visible} />;

                    case DropdownAction.AUTOSUGGEST_ALIAS:
                        return (
                            <AliasAutoSuggest
                                prefix={state.prefix}
                                domain={state.domain}
                                onMessage={onMessageWithReset}
                            />
                        );
                }
            })()}
        </div>
    );
};

export const DropdownSwitch = forwardRef(DropdownSwitchRender);
