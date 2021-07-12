import React from 'react';
import { c } from 'ttag';

import {
    Button,
    Checkbox,
    classnames,
    Icon,
    SidebarListItem,
    SidebarListItemContent,
    SidebarListItemDiv,
    SimpleDropdown,
    Tooltip,
    useAppLink,
    useModals,
    useUser,
} from '@proton/components';
import { noop } from '@proton/shared/lib/helpers/function';
import { Calendar } from '@proton/shared/lib/interfaces/calendar';
import { getIsCalendarDisabled } from '@proton/shared/lib/calendar/calendar';

import './CalendarSidebarListItems.scss';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import { CalendarModal } from '@proton/components/containers/calendar/calendarModal/CalendarModal';
import { APPS } from '@proton/shared/lib/constants';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { getIsPersonalCalendar } from '@proton/shared/lib/calendar/subscribe/helpers';
import { getContrastingColor } from '../../helpers/color';

interface Props {
    calendars?: Calendar[];
    loading?: boolean;
    onChangeVisibility: (id: string, checked: boolean) => void;
    actionsDisabled?: boolean;
}

const CalendarSidebarListItems = ({
    calendars = [],
    loading = false,
    onChangeVisibility = noop,
    actionsDisabled = false,
}: Props) => {
    const { createModal } = useModals();
    const goToApp = useAppLink();
    const [user] = useUser();

    if (calendars.length === 0) {
        return null;
    }

    const isSharingAllowed = getIsPersonalCalendar(calendars[0]);

    const result = calendars.map((calendar, i) => {
        const { ID, Name, Display, Color } = calendar;
        const isCalendarDisabled = getIsCalendarDisabled(calendar);

        const left = (
            <Checkbox
                className="mr0-25 flex-item-noshrink"
                color={getContrastingColor(Color)}
                backgroundColor={Display ? Color : 'transparent'}
                borderColor={Color}
                checked={!!Display}
                disabled={loading}
                aria-describedby={`calendar-${i}`}
                onChange={({ target: { checked } }) => onChangeVisibility(ID, checked)}
            />
        );

        const dropdownItems = [
            {
                text: c('Action').t`Edit`,
                onClick: (calendar: Calendar) => createModal(<CalendarModal calendar={calendar} />),
            },
            isSharingAllowed &&
                !user.isFree && {
                    text: c('Action').t`Share`,
                    onClick: (calendar: Calendar) =>
                        goToApp(`/calendar/calendars?share=${calendar.ID}`, APPS.PROTONACCOUNT),
                },
        ].filter(isTruthy);

        return (
            <SidebarListItem key={ID}>
                <SidebarListItemDiv className="calendar-sidebar-list-item pt0-5 pb0-5 pr0-5">
                    <SidebarListItemContent
                        data-test-id="calendar-sidebar:user-calendars"
                        left={left}
                        className={classnames(['flex', isCalendarDisabled && 'color-weak'])}
                    >
                        <div className="flex flex-nowrap flex-justify-space-between flex-align-items-center">
                            <div className="flex flex-nowrap mr0-5">
                                <div className="text-ellipsis" title={Name}>
                                    {Name}
                                </div>
                                {isCalendarDisabled && (
                                    <div className="flex-item-noshrink">
                                        &nbsp;({c('Disabled calendar name suffix').t`disabled`})
                                    </div>
                                )}
                            </div>

                            <Tooltip title={c('Sidebar calendar edit tooltip').t`Manage calendar`}>
                                <SimpleDropdown
                                    as={Button}
                                    icon
                                    hasCaret={false}
                                    shape="ghost"
                                    size="small"
                                    className="calendar-sidebar-list-item-action no-border flex cursor-pointer flex-item-noshrink no-mobile"
                                    loading={actionsDisabled}
                                    content={<Icon name="3-dots-horizontal" />}
                                >
                                    <DropdownMenu>
                                        {dropdownItems.map(({ text, onClick }) => {
                                            return (
                                                <DropdownMenuButton
                                                    className="text-left"
                                                    key={text}
                                                    onClick={() => onClick(calendar)}
                                                >
                                                    {text}
                                                </DropdownMenuButton>
                                            );
                                        })}
                                    </DropdownMenu>
                                </SimpleDropdown>
                            </Tooltip>
                        </div>
                    </SidebarListItemContent>
                </SidebarListItemDiv>
            </SidebarListItem>
        );
    });

    return <>{result}</>;
};

export default CalendarSidebarListItems;
