import { useState } from 'react';

import { Button } from 'packages/atoms/src/Button/Button';
import { Tooltip } from 'packages/atoms/src/Tooltip/Tooltip';
import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { changeCalendarVisiblity } from '@proton/calendar/calendars/actions';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import SimpleDropdown from '@proton/components/components/dropdown/SimpleDropdown';
import Icon from '@proton/components/components/icon/Icon';
import SidebarList from '@proton/components/components/sidebar/SidebarList';
import SidebarListItemHeaderLink from '@proton/components/components/sidebar/SidebarListItemHeaderLink';
import SimpleSidebarListItemHeader from '@proton/components/components/sidebar/SimpleSidebarListItemHeader';
import { useLoadingByKey } from '@proton/hooks/useLoading';
import { getCalendarsSettingsPath } from '@proton/shared/lib/calendar/settingsRoutes';
import { APPS } from '@proton/shared/lib/constants';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import noop from '@proton/utils/noop';

import { useCalendarDispatch } from '../../../store/hooks';
import CalendarSidebarListItems from '../CalendarSidebarListItems';

interface Props {
    myCalendars: VisualCalendar[];
    allCalendars: VisualCalendar[];
    isOtherCalendarsLimitReached: boolean;
    dropdownRef: React.RefObject<HTMLDivElement>;
    handleCreatePersonalCalendar: () => void;
    handleAddHolidaysCalendar: () => void;
    handleCreateSubscribedCalendar: () => void;
}

export const MyCalendars = ({
    myCalendars,
    allCalendars,
    isOtherCalendarsLimitReached,
    dropdownRef,
    handleCreatePersonalCalendar,
    handleAddHolidaysCalendar,
    handleCreateSubscribedCalendar,
}: Props) => {
    const [displayMyCalendars, setDisplayMyCalendars] = useState(true);

    const dispatch = useCalendarDispatch();
    const [addresses = []] = useAddresses();
    const [loadingVisibility, withLoadingVisibility] = useLoadingByKey();

    const handleChangeVisibility = async (calendarID: string, display: boolean) => {
        dispatch(changeCalendarVisiblity({ calendarID, display })).catch(noop);
    };

    const addCalendarText = c('Dropdown action icon tooltip').t`Add calendar`;

    return (
        <SidebarList>
            <SimpleSidebarListItemHeader
                toggle={displayMyCalendars}
                onToggle={() => setDisplayMyCalendars((prevState) => !prevState)}
                right={
                    <div className="flex flex-nowrap items-center">
                        {!isOtherCalendarsLimitReached ? (
                            <Tooltip title={addCalendarText}>
                                <SimpleDropdown
                                    as="button"
                                    type="button"
                                    hasCaret={false}
                                    className="navigation-link-header-group-control flex"
                                    content={<Icon name="plus" className="navigation-icon" alt={addCalendarText} />}
                                    ref={dropdownRef}
                                >
                                    <DropdownMenu>
                                        <DropdownMenuButton
                                            className="text-left"
                                            onClick={handleCreatePersonalCalendar}
                                        >
                                            {c('Action').t`Create calendar`}
                                        </DropdownMenuButton>
                                        <DropdownMenuButton className="text-left" onClick={handleAddHolidaysCalendar}>
                                            {c('Action').t`Add public holidays`}
                                        </DropdownMenuButton>
                                        <DropdownMenuButton
                                            className="text-left"
                                            onClick={handleCreateSubscribedCalendar}
                                        >
                                            {c('Calendar sidebar dropdown item').t`Add calendar from URL`}
                                        </DropdownMenuButton>
                                    </DropdownMenu>
                                </SimpleDropdown>
                            </Tooltip>
                        ) : (
                            <Button
                                shape="ghost"
                                color="weak"
                                size="medium"
                                icon
                                className="navigation-link-header-group-control"
                                onClick={handleCreatePersonalCalendar}
                            >
                                <Tooltip title={addCalendarText}>
                                    <Icon name="plus" className="navigation-icon" alt={addCalendarText} />
                                </Tooltip>
                            </Button>
                        )}
                        <Tooltip title={c('Info').t`Manage your calendars`}>
                            <SidebarListItemHeaderLink
                                toApp={APPS.PROTONACCOUNT}
                                to={getCalendarsSettingsPath({ fullPath: true })}
                                target="_self"
                                icon="cog-wheel"
                                alt={c('Link').t`Calendars`}
                            />
                        </Tooltip>
                    </div>
                }
                text={c('Link').t`My calendars`}
                testId="calendar-sidebar:my-calendars-button"
            />
            {displayMyCalendars && (
                <CalendarSidebarListItems
                    calendars={myCalendars}
                    allCalendars={allCalendars}
                    onChangeVisibility={(calendarID, value) =>
                        withLoadingVisibility(calendarID, handleChangeVisibility(calendarID, value))
                    }
                    addresses={addresses}
                    loadingVisibility={loadingVisibility}
                />
            )}
        </SidebarList>
    );
};
