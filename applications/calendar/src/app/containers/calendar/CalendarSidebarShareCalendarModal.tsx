import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalOwnProps as MainModalOwnProps } from '@proton/components';
import { ActionCard, BasicModal } from '@proton/components';
import { BRAND_NAME } from '@proton/shared/lib/constants';

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
                title={c('Action title').t`Share with ${BRAND_NAME} users`}
                subtitle={c('Action subline').t`They can view or edit your calendar`}
                loading={loadingFetchMembersAndInvitations}
            />
            <hr className="my-2" />
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
