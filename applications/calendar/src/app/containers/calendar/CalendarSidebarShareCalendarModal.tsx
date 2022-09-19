import { c } from 'ttag';

import { ActionCard, BasicModal, Button, ModalOwnProps as MainModalOwnProps } from '@proton/components/components';

interface CalendarSidebarCreateCalendarModalProps extends MainModalOwnProps {
    isOpen: boolean;
    calendarName: string;
    onClose: () => void;
    onSharePrivately: () => Promise<void>;
    onSharePublicly: () => void;
    loadingFetchMembersAndInvitations: boolean;
    loadingLinks: boolean;
}

const CalendarSidebarShareCalendarModal = ({
    isOpen,
    calendarName,
    onClose,
    onSharePrivately,
    onSharePublicly,
    loadingFetchMembersAndInvitations,
    loadingLinks,
    ...rest
}: CalendarSidebarCreateCalendarModalProps) => {
    return (
        <BasicModal
            hasClose={false}
            title={c('Modal title').t`Share calendar`}
            subline={calendarName}
            isOpen={isOpen}
            footer={
                <Button fullWidth onClick={onClose}>
                    {c('Action').t`Cancel`}
                </Button>
            }
            {...rest}
        >
            <ActionCard
                onClick={onSharePrivately}
                iconName="users"
                title={c('Action title').t`Share with Proton users`}
                subtitle={c('Action subline').t`They can view or edit your calendar`}
                loading={loadingFetchMembersAndInvitations}
            />
            <hr className="my0-5" />
            <ActionCard
                onClick={onSharePublicly}
                iconName="link"
                title={c('Action title').t`Share with anyone`}
                subtitle={c('Action subline').t`Anyone with the link can view your calendar`}
                loading={loadingLinks}
            />
        </BasicModal>
    );
};

export default CalendarSidebarShareCalendarModal;
