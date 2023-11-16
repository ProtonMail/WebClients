import type { VFC } from 'react';
import { useEffect, useMemo } from 'react';

import { PauseListDropdown } from 'proton-pass-extension/app/content/injections/apps/common/PauseListDropdown';
import { useIFrameContext } from 'proton-pass-extension/app/content/injections/apps/context/IFrameContextProvider';
import { DropdownHeader } from 'proton-pass-extension/app/content/injections/apps/dropdown/components/DropdownHeader';
import { DropdownItem } from 'proton-pass-extension/app/content/injections/apps/dropdown/components/DropdownItem';
import { DropdownItemsList } from 'proton-pass-extension/app/content/injections/apps/dropdown/components/DropdownItemsList';
import type { IFrameCloseOptions, IFrameMessage } from 'proton-pass-extension/app/content/types';
import { IFrameMessageType } from 'proton-pass-extension/app/content/types';
import { c } from 'ttag';

import { useNavigateToUpgrade } from '@proton/pass/hooks/useNavigateToUpgrade';
import { contentScriptMessage, sendMessage } from '@proton/pass/lib/extension/message';
import { createTelemetryEvent } from '@proton/pass/lib/telemetry/event';
import { type SafeLoginItem, WorkerMessageType } from '@proton/pass/types';
import { PassIconStatus } from '@proton/pass/types/data/pass-icon';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

type Props = {
    items: SafeLoginItem[];
    hostname: string;
    needsUpgrade: boolean;
    visible?: boolean;
    onClose?: (options?: IFrameCloseOptions) => void;
    onMessage?: (message: IFrameMessage) => void;
};

export const ItemsList: VFC<Props> = ({ hostname, items, needsUpgrade, visible, onMessage, onClose }) => {
    const { settings } = useIFrameContext();
    const navigateToUpgrade = useNavigateToUpgrade();

    useEffect(() => {
        if (visible) {
            void sendMessage(
                contentScriptMessage({
                    type: WorkerMessageType.TELEMETRY_EVENT,
                    payload: {
                        event: createTelemetryEvent(TelemetryEventName.AutofillDisplay, {}, { location: 'source' }),
                    },
                })
            );
        }
    }, [visible]);

    const dropdownItems = useMemo(
        () =>
            [
                needsUpgrade && (
                    <DropdownItem
                        key={'upgrade-autofill'}
                        icon="arrow-out-square"
                        title={c('Info').t`Upgrade ${PASS_APP_NAME}`}
                        subTitle={c('Warning').t`Your plan only allows you to autofill from your first two vaults`}
                        onClick={navigateToUpgrade}
                        autogrow
                    />
                ),
                ...items.map(({ shareId, itemId, username, name, url }) => (
                    <DropdownItem
                        key={itemId}
                        title={name}
                        subTitle={username}
                        url={settings.loadDomainImages ? url : undefined}
                        icon="user"
                        onClick={() =>
                            sendMessage.onSuccess(
                                contentScriptMessage({
                                    type: WorkerMessageType.AUTOFILL_SELECT,
                                    payload: { shareId, itemId },
                                }),
                                ({ username, password }) => {
                                    onMessage?.({
                                        type: IFrameMessageType.DROPDOWN_AUTOFILL_LOGIN,
                                        payload: { username, password },
                                    });
                                }
                            )
                        }
                    />
                )),
            ].filter(truthy),
        [items, needsUpgrade, onMessage]
    );

    return (
        <>
            <DropdownHeader
                title={c('Title').t`Log in as...`}
                extra={
                    <PauseListDropdown
                        criteria="Autofill"
                        dense
                        hostname={hostname}
                        label={c('Action').t`Do not suggest on this website`}
                        onClose={onClose}
                        visible={visible}
                    />
                }
            />
            {dropdownItems.length > 0 ? (
                <DropdownItemsList>{dropdownItems}</DropdownItemsList>
            ) : (
                <DropdownItem
                    icon={PassIconStatus.ACTIVE}
                    onClick={() => onClose?.()}
                    title={PASS_APP_NAME}
                    subTitle={c('Info').t`No login found`}
                />
            )}
        </>
    );
};
