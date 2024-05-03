import type { FC } from 'react';
import { useMemo } from 'react';

import { useIFrameContext } from 'proton-pass-extension/app/content/injections/apps/components/IFrameApp';
import { ListItem } from 'proton-pass-extension/app/content/injections/apps/components/ListItem';
import { PauseListDropdown } from 'proton-pass-extension/app/content/injections/apps/components/PauseListDropdown';
import { DropdownHeader } from 'proton-pass-extension/app/content/injections/apps/dropdown/components/DropdownHeader';
import { DropdownItemsList } from 'proton-pass-extension/app/content/injections/apps/dropdown/components/DropdownItemsList';
import { IFrameMessageType } from 'proton-pass-extension/app/content/types';
import { c } from 'ttag';

import { UpsellRef } from '@proton/pass/constants';
import { useNavigateToUpgrade } from '@proton/pass/hooks/useNavigateToUpgrade';
import { useTelemetryEvent } from '@proton/pass/hooks/useTelemetryEvent';
import { contentScriptMessage, sendMessage } from '@proton/pass/lib/extension/message';
import { type SafeLoginItem, WorkerMessageType } from '@proton/pass/types';
import { PassIconStatus } from '@proton/pass/types/data/pass-icon';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

type Props = {
    items: SafeLoginItem[];
    hostname: string;
    needsUpgrade: boolean;
};

export const AutofillLogin: FC<Props> = ({ hostname, items, needsUpgrade }) => {
    const { settings, visible, close, forwardMessage } = useIFrameContext();
    const navigateToUpgrade = useNavigateToUpgrade({ upsellRef: UpsellRef.LIMIT_AUTOFILL });

    useTelemetryEvent(TelemetryEventName.AutofillDisplay, {}, { location: 'source' })([visible]);

    const dropdownItems = useMemo(
        () =>
            [
                needsUpgrade && (
                    <ListItem
                        key={'upgrade-autofill'}
                        icon="arrow-out-square"
                        title={c('Info').t`Upgrade ${PASS_APP_NAME}`}
                        subTitle={c('Warning').t`Your plan only allows you to autofill from your first two vaults`}
                        onClick={navigateToUpgrade}
                        autogrow
                    />
                ),
                ...items.map(({ shareId, itemId, username, name, url }) => (
                    <ListItem
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
                                    forwardMessage({
                                        type: IFrameMessageType.DROPDOWN_AUTOFILL_LOGIN,
                                        payload: { username, password },
                                    });
                                    close({ refocus: false });
                                }
                            )
                        }
                    />
                )),
            ].filter(truthy),
        [items, needsUpgrade, forwardMessage]
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
                    />
                }
            />
            {dropdownItems.length > 0 ? (
                <DropdownItemsList>{dropdownItems}</DropdownItemsList>
            ) : (
                <ListItem
                    icon={PassIconStatus.ACTIVE}
                    onClick={close}
                    title={PASS_APP_NAME}
                    subTitle={c('Info').t`No login found`}
                />
            )}
        </>
    );
};
