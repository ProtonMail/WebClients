import { c } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import ButtonGroup from '@proton/components/components/button/ButtonGroup';
import Icon from '@proton/components/components/icon/Icon';
import SidebarPrimaryButton from '@proton/components/components/sidebar/SidebarPrimaryButton';
import clsx from '@proton/utils/clsx';

import { BookingSidebarAction } from '../../bookings/BookingSidebarAction';
import { useBookingsAvailability } from '../../bookings/useBookingsAvailability';

interface Props {
    collapsed: boolean;
    onCreateEvent?: () => void;
}

const PrimaryAction = ({ collapsed, onCreateEvent, group = false }: Props & { group?: boolean }) => {
    return (
        <Tooltip title={collapsed ? c('Action').t`New event` : null}>
            <SidebarPrimaryButton
                data-testid="calendar-view:new-event-button"
                disabled={!onCreateEvent}
                onClick={() => {
                    onCreateEvent?.();
                }}
                group={group}
                className={clsx('hidden md:flex items-center justify-center flex-nowrap gap-2', collapsed && 'px-0')}
            >
                {collapsed ? (
                    <Icon name="plus" className="flex mx-auto my-0.5" alt={c('Action').t`New event`} />
                ) : (
                    <span className="text-ellipsis">{c('Action').t`New event`}</span>
                )}
            </SidebarPrimaryButton>
        </Tooltip>
    );
};

export const PrimaryButton = ({ collapsed, onCreateEvent }: Props) => {
    const isBookingAvailable = useBookingsAvailability();

    if (collapsed || !isBookingAvailable) {
        return <PrimaryAction collapsed={collapsed} onCreateEvent={onCreateEvent} />;
    }

    return (
        <ButtonGroup color="norm" shape="solid" size="large" className="w-full">
            <PrimaryAction collapsed={collapsed} onCreateEvent={onCreateEvent} group />
            <BookingSidebarAction onCreateEvent={onCreateEvent} />
        </ButtonGroup>
    );
};
