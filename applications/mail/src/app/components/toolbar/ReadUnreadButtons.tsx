import { useMemo } from 'react';

import { c } from 'ttag';

import { Kbd } from '@proton/atoms';
import { Icon, ToolbarButton } from '@proton/components';
import { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';

import useMailModel from 'proton-mail/hooks/useMailModel';
import { useMailSelector } from 'proton-mail/store/hooks';

import { elementsAreUnread as elementsAreUnreadSelector } from '../../store/elements/elementsSelectors';
import { SOURCE_ACTION } from '../list/list-telemetry/useListTelemetry';

interface Props {
    selectedIDs: string[];
    onMarkAs: (status: MARK_AS_STATUS, sourceAction: SOURCE_ACTION) => Promise<void>;
}

const ReadUnreadButtons = ({ selectedIDs, onMarkAs }: Props) => {
    const { Shortcuts } = useMailModel('MailSettings');

    const elementsAreUnread = useMailSelector(elementsAreUnreadSelector);

    const buttonMarkAsRead = useMemo(() => {
        const allRead = selectedIDs.every((elementID) => !elementsAreUnread[elementID]);
        return !allRead;
    }, [selectedIDs, elementsAreUnread]);

    if (!selectedIDs.length) {
        return null;
    }

    const titleRead = Shortcuts ? (
        <>
            {c('Action').t`Mark as read`}
            <br />
            <Kbd shortcut="R" />
        </>
    ) : (
        c('Action').t`Mark as read`
    );

    const titleUnread = Shortcuts ? (
        <>
            {c('Action').t`Mark as unread`}
            <br />
            <Kbd shortcut="U" />
        </>
    ) : (
        c('Action').t`Mark as unread`
    );

    return (
        <>
            {buttonMarkAsRead ? (
                <ToolbarButton
                    key="read"
                    title={titleRead}
                    disabled={!selectedIDs.length}
                    onClick={() => onMarkAs(MARK_AS_STATUS.READ, SOURCE_ACTION.TOOLBAR)}
                    data-testid="toolbar:read"
                    icon={<Icon name="envelope-open" alt={c('Action').t`Mark as read`} />}
                />
            ) : (
                <ToolbarButton
                    key="unread"
                    title={titleUnread}
                    disabled={!selectedIDs.length}
                    onClick={() => onMarkAs(MARK_AS_STATUS.UNREAD, SOURCE_ACTION.TOOLBAR)}
                    data-testid="toolbar:unread"
                    icon={<Icon name="envelope-dot" alt={c('Action').t`Mark as unread`} />}
                />
            )}
        </>
    );
};

export default ReadUnreadButtons;
