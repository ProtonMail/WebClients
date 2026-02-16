import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import SidebarListItem from '@proton/components/components/sidebar/SidebarListItem';
import { IcCalendarGrid } from '@proton/icons/icons/IcCalendarGrid';
import { IcCalendarListFilled } from '@proton/icons/icons/IcCalendarListFilled';

type CalendarSidebarCollapsedButtonType = 'bookings' | 'calendars';

interface Props {
    type: CalendarSidebarCollapsedButtonType;
    onClick: () => void;
    title: string;
}

export const CalendarSidebarCollapsedButton = ({ type, onClick, title }: Props) => {
    const iconNavigationBar = (type: CalendarSidebarCollapsedButtonType) => {
        switch (type) {
            case 'bookings':
                return <IcCalendarListFilled alt={title} className="mx-auto" />;
            case 'calendars':
                return <IcCalendarGrid alt={title} className="mx-auto" />;
        }
    };

    return (
        <SidebarListItem>
            <Tooltip originalPlacement="right" title={title}>
                <button
                    onClick={onClick}
                    className="flex items-center relative navigation-link-header-group-link mx-auto w-full"
                >
                    {iconNavigationBar(type)}
                </button>
            </Tooltip>
        </SidebarListItem>
    );
};
