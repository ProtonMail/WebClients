import { MESSAGE_BUTTONS } from '@proton/shared/lib/constants';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { Icon, useLoading, useMailSettings, ToolbarButton } from '@proton/components';
import { c } from 'ttag';

import { useMarkAs, MARK_AS_STATUS } from '../../hooks/useMarkAs';
import { useGetElementsFromIDs } from '../../hooks/mailbox/useElements';

const { READ, UNREAD } = MARK_AS_STATUS;

interface Props {
    labelID: string;
    mailSettings: MailSettings;
    selectedIDs: string[];
    onBack: () => void;
}

const ReadUnreadButtons = ({ labelID, mailSettings, selectedIDs, onBack }: Props) => {
    // INFO MessageButtons cannot be changed in setting anymore but we keep the logic for people using it
    const { MessageButtons = MESSAGE_BUTTONS.READ_UNREAD } = mailSettings;
    const [loading, withLoading] = useLoading();
    const markAs = useMarkAs();
    const getElementsFromIDs = useGetElementsFromIDs();
    const [{ Shortcuts = 0 } = {}] = useMailSettings();

    const handleMarkAs = async (status: MARK_AS_STATUS) => {
        const isUnread = status === UNREAD;
        const elements = getElementsFromIDs(selectedIDs);
        if (isUnread) {
            onBack();
        }
        await markAs(elements, labelID, status);
    };

    const titleRead = Shortcuts ? (
        <>
            {c('Action').t`Mark as read`}
            <br />
            <kbd className="border-none">R</kbd>
        </>
    ) : (
        c('Action').t`Mark as read`
    );

    const titleUnread = Shortcuts ? (
        <>
            {c('Action').t`Mark as unread`}
            <br />
            <kbd className="border-none">U</kbd>
        </>
    ) : (
        c('Action').t`Mark as unread`
    );

    const buttons = [
        <ToolbarButton
            key="read"
            title={titleRead}
            disabled={loading || !selectedIDs.length}
            onClick={() => withLoading(handleMarkAs(READ))}
            className="no-tablet no-mobile"
            data-testid="toolbar:read"
            icon={<Icon name="eye" alt={c('Action').t`Mark as read`} />}
        />,
        <ToolbarButton
            key="unread"
            title={titleUnread}
            disabled={loading || !selectedIDs.length}
            onClick={() => withLoading(handleMarkAs(UNREAD))}
            data-testid="toolbar:unread"
            icon={<Icon name="eye-slash" alt={c('Action').t`Mark as unread`} />}
        />,
    ];

    if (MessageButtons === MESSAGE_BUTTONS.UNREAD_READ) {
        buttons.reverse();
    }

    // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/20356
    return <>{buttons}</>;
};

export default ReadUnreadButtons;
