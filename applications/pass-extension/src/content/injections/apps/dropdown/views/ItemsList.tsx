import type { VFC } from 'react';
import { useEffect, useMemo } from 'react';

import { c } from 'ttag';

import { contentScriptMessage, sendMessage } from '@proton/pass/extension/message';
import { createTelemetryEvent } from '@proton/pass/telemetry/events';
import { type SafeLoginItem, WorkerMessageType } from '@proton/pass/types';
import { PassIconStatus } from '@proton/pass/types/data/pass-icon';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { truthy } from '@proton/pass/utils/fp';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { navigateToUpgrade } from '../../../../../shared/components/upgrade/UpgradeButton';
import type { IFrameCloseOptions, IFrameMessage } from '../../../../types';
import { IFrameMessageType } from '../../../../types';
import { useIFrameContext } from '../../context/IFrameContextProvider';
import { DropdownItem } from '../components/DropdownItem';
import { DropdownItemsList } from '../components/DropdownItemsList';

type Props = {
    items: SafeLoginItem[];
    needsUpgrade: boolean;
    visible?: boolean;
    onClose?: (options?: IFrameCloseOptions) => void;
    onMessage?: (message: IFrameMessage) => void;
};

export const ItemsList: VFC<Props> = ({ items, needsUpgrade, visible, onMessage, onClose }) => {
    const { settings } = useIFrameContext();

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
                        subTitle={
                            <span className="text-sm block">{c('Warning')
                                .t`Your plan only allows you to autofill from your primary vault`}</span>
                        }
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

    return dropdownItems.length > 0 ? (
        <DropdownItemsList>{dropdownItems}</DropdownItemsList>
    ) : (
        <DropdownItem
            icon={PassIconStatus.ACTIVE}
            onClick={() => onClose?.()}
            title={PASS_APP_NAME}
            subTitle={c('Info').t`No login found`}
        />
    );
};
