import { type ForwardRefRenderFunction, forwardRef } from 'react';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import type { MaybeNull } from '@proton/pass/types';
import { WorkerStatus } from '@proton/pass/types';
import { PassIconStatus } from '@proton/pass/types/data/pass-icon';
import { pixelEncoder } from '@proton/pass/utils/dom';
import { workerBusy } from '@proton/pass/utils/worker';
import { FORK_TYPE } from '@proton/shared/lib/authentication/ForkInterface';
import { BRAND_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';

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
    onResize?: () => void;
};

const DropdownSwitchRender: ForwardRefRenderFunction<HTMLDivElement, Props> = (
    { state, loggedIn, status, visible, onClose, onResize, onMessage },
    ref
) => {
    const accountFork = useAccountFork();

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
                    return (
                        <DropdownPinUnlock
                            onError={onResize}
                            onUnlock={() => onClose?.({ refocus: true })}
                            visible={visible}
                        />
                    );
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
                                onMessage={onMessage}
                                onClose={onClose}
                                visible={visible}
                            />
                        );

                    case DropdownAction.AUTOSUGGEST_PASSWORD:
                        return <PasswordAutoSuggest onMessage={onMessage} />;

                    case DropdownAction.AUTOSUGGEST_ALIAS:
                        return (
                            <AliasAutoSuggest
                                prefix={state.prefix}
                                domain={state.domain}
                                onOptions={onResize}
                                onMessage={onMessage}
                            />
                        );
                }
            })()}
        </div>
    );
};

export const DropdownSwitch = forwardRef(DropdownSwitchRender);
