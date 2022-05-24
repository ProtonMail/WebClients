import { MESSAGE_BUTTONS } from '@proton/shared/lib/constants';
import { Icon, useLoading, ToolbarButton, useMailSettings } from '@proton/components';
import { c } from 'ttag';
import { Vr } from '@proton/atoms';
import { MARK_AS_STATUS } from '../../hooks/useMarkAs';

const { READ, UNREAD } = MARK_AS_STATUS;

interface Props {
    selectedIDs: string[];
    onMarkAs: (status: MARK_AS_STATUS) => Promise<void>;
}

const ReadUnreadButtons = ({ selectedIDs, onMarkAs }: Props) => {
    // INFO MessageButtons cannot be changed in setting anymore but we keep the logic for people using it
    const [{ MessageButtons = MESSAGE_BUTTONS.READ_UNREAD, Shortcuts = 0 } = {}] = useMailSettings();
    const [loading, withLoading] = useLoading();

    if (!selectedIDs.length) {
        return null;
    }

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
            onClick={() => withLoading(onMarkAs(READ))}
            className="no-tablet no-mobile"
            data-testid="toolbar:read"
            icon={<Icon name="eye" alt={c('Action').t`Mark as read`} />}
        />,
        <ToolbarButton
            key="unread"
            title={titleUnread}
            disabled={loading || !selectedIDs.length}
            onClick={() => withLoading(onMarkAs(UNREAD))}
            data-testid="toolbar:unread"
            icon={<Icon name="eye-slash" alt={c('Action').t`Mark as unread`} />}
        />,
    ];

    if (MessageButtons === MESSAGE_BUTTONS.UNREAD_READ) {
        buttons.reverse();
    }

    // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/20356
    return (
        <>
            <Vr />
            {buttons}
        </>
    );
};

export default ReadUnreadButtons;
