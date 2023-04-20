import { type VFC, useCallback, useLayoutEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import type { AliasState } from '@proton/pass/store';
import { type Realm, type SafeLoginItem, WorkerStatus } from '@proton/pass/types';
import { pixelEncoder } from '@proton/pass/utils/dom';
import { merge } from '@proton/pass/utils/object';
import { FORK_TYPE } from '@proton/shared/lib/authentication/ForkInterface';
import { BRAND_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';

import { useNavigateToLogin } from '../../../../shared/hooks';
import { DropdownAction, IFrameMessage, IFrameMessageType } from '../../../types';
import { useIFrameContext, useRegisterMessageHandler } from '../../iframe/IFrameContextProvider';
import { DropdownItem } from '../components/DropdownItem';
import { AliasAutoSuggest } from './AliasAutoSuggest';
import { ItemsList } from './ItemsList';
import { PasswordAutoSuggest } from './PasswordAutoSuggest';

type DropdownState = {
    action?: DropdownAction;
    items: SafeLoginItem[];
    aliasOptions: AliasState['aliasOptions'];
    realm: Realm;
};

export const DropdownContent: VFC = () => {
    const { workerState, resizeIFrame, closeIFrame } = useIFrameContext();
    const [dropdownState, setDropdownState] = useState<DropdownState>({
        action: undefined,
        items: [],
        aliasOptions: null,
        realm: '',
    });

    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigateToLogin = useNavigateToLogin();

    const handleAction = useCallback(({ payload }: IFrameMessage<IFrameMessageType.DROPDOWN_ACTION>) => {
        switch (payload.action) {
            case DropdownAction.AUTOFILL:
                return setDropdownState((state) => merge(state, payload));
            case DropdownAction.AUTOSUGGEST_PASSWORD:
                return setDropdownState((state) => merge(state, { items: [], action: payload.action }));
            case DropdownAction.AUTOSUGGEST_ALIAS:
                return setDropdownState((state) =>
                    merge(state, {
                        items: [],
                        action: payload.action,
                        aliasOptions: payload.options,
                        realm: payload.realm,
                    })
                );
        }
    }, []);

    const handleOpen = useCallback(() => resizeIFrame(dropdownRef.current), [resizeIFrame]);
    useLayoutEffect(() => {
        resizeIFrame(dropdownRef.current);
    });

    useRegisterMessageHandler(IFrameMessageType.DROPDOWN_ACTION, handleAction);
    useRegisterMessageHandler(IFrameMessageType.IFRAME_OPEN, handleOpen);

    return (
        <div ref={dropdownRef} className="min-h-custom bg-norm" style={{ '--min-height-custom': pixelEncoder(60) }}>
            {(() => {
                if (workerState === undefined) {
                    return <CircleLoader />;
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
                                await navigateToLogin(FORK_TYPE.SWITCH);
                            }}
                            title={PASS_APP_NAME}
                            subTitle={c('Info').t`Login with your ${BRAND_NAME} account`}
                        />
                    );
                }

                switch (action) {
                    case DropdownAction.AUTOFILL:
                        return dropdownState.items.length > 0 ? (
                            <ItemsList items={dropdownState.items} />
                        ) : (
                            <DropdownItem
                                onClick={closeIFrame}
                                title={PASS_APP_NAME}
                                subTitle={c('Info').t`No login found`}
                                disabled
                            />
                        );

                    case DropdownAction.AUTOSUGGEST_PASSWORD:
                        return <PasswordAutoSuggest />;

                    case DropdownAction.AUTOSUGGEST_ALIAS:
                        return <AliasAutoSuggest options={dropdownState.aliasOptions} prefix={dropdownState.realm} />;
                }
            })()}
        </div>
    );
};
