import { useState } from 'react';

import { Button } from 'packages/atoms/src/Button/Button';
import { Tooltip } from 'packages/atoms/src/Tooltip/Tooltip';
import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useCalendarUserSettings } from '@proton/calendar';
import { changeCalendarVisiblity } from '@proton/calendar/calendars/actions';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import SimpleDropdown from '@proton/components/components/dropdown/SimpleDropdown';
import Icon from '@proton/components/components/icon/Icon';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import SidebarList from '@proton/components/components/sidebar/SidebarList';
import SidebarListItemHeaderLink from '@proton/components/components/sidebar/SidebarListItemHeaderLink';
import SimpleSidebarListItemHeader from '@proton/components/components/sidebar/SimpleSidebarListItemHeader';
import CalendarLimitReachedModal from '@proton/components/containers/calendar/CalendarLimitReachedModal';
import HolidaysCalendarModal from '@proton/components/containers/calendar/calendarModal/holidaysCalendarModal/HolidaysCalendarModal';
import SubscribedCalendarModal from '@proton/components/containers/calendar/calendarModal/subscribedCalendarModal/SubscribedCalendarModal';
import { PersonalCalendarModal } from '@proton/components/index';
import { useLoadingByKey } from '@proton/hooks/useLoading';
import { DEFAULT_CALENDAR_USER_SETTINGS } from '@proton/shared/lib/calendar/calendar';
import { getCalendarsSettingsPath } from '@proton/shared/lib/calendar/settingsRoutes';
import { APPS } from '@proton/shared/lib/constants';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import noop from '@proton/utils/noop';

import { useCalendarDispatch } from '../../../store/hooks';
import CalendarSidebarListItems from '../CalendarSidebarListItems';

interface Props {
    isCalendarsLimitReached: boolean;
    myCalendars: VisualCalendar[];
    allCalendars: VisualCalendar[];
    holidaysCalendars: VisualCalendar[];
    isOtherCalendarsLimitReached: boolean;
    dropdownRef: React.RefObject<HTMLDivElement>;
    onCreateCalendar?: (id: string) => void;
}

export const MyCalendars = ({
    isCalendarsLimitReached,
    myCalendars,
    allCalendars,
    holidaysCalendars,
    isOtherCalendarsLimitReached,
    dropdownRef,
    onCreateCalendar,
}: Props) => {
    const [displayMyCalendars, setDisplayMyCalendars] = useState(true);

    const [user] = useUser();
    const [addresses = []] = useAddresses();
    const [calendarUserSettings = DEFAULT_CALENDAR_USER_SETTINGS] = useCalendarUserSettings();

    const dispatch = useCalendarDispatch();
    const [loadingVisibility, withLoadingVisibility] = useLoadingByKey();

    const [calModal, setIsCalModalOpen, renderCalModal] = useModalState();
    const [holidaysCalModal, setIsHolidaysCalModalOpen, renderHolidaysCalModal] = useModalState();
    const [subscribedCalModal, setIsSubscribedCalModalOpen, renderSubscribedCalModal] = useModalState();
    const [limitReachedModal, setIsLimitReachedModalOpen, renderLimitReachedModal] = useModalState();

    const handleChangeVisibility = async (calendarID: string, display: boolean) => {
        dispatch(changeCalendarVisiblity({ calendarID, display })).catch(noop);
    };

    const handleCreatePersonalCalendar = () => {
        if (!isCalendarsLimitReached) {
            setIsCalModalOpen(true);
        } else {
            setIsLimitReachedModalOpen(true);
        }
    };

    const handleAddHolidaysCalendar = () => {
        if (!isCalendarsLimitReached) {
            setIsHolidaysCalModalOpen(true);
        } else {
            setIsLimitReachedModalOpen(true);
        }
    };

    const handleCreateSubscribedCalendar = () => {
        if (!isOtherCalendarsLimitReached) {
            setIsSubscribedCalModalOpen(true);
        } else {
            setIsLimitReachedModalOpen(true);
        }
    };

    const addCalendarText = c('Dropdown action icon tooltip').t`Add calendar`;

    return (
        <>
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
                                            <DropdownMenuButton
                                                className="text-left"
                                                onClick={handleAddHolidaysCalendar}
                                            >
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

            {renderSubscribedCalModal && (
                <SubscribedCalendarModal {...subscribedCalModal} onCreateCalendar={onCreateCalendar} />
            )}
            {renderHolidaysCalModal && (
                <HolidaysCalendarModal {...holidaysCalModal} holidaysCalendars={holidaysCalendars} />
            )}
            {renderLimitReachedModal && (
                <CalendarLimitReachedModal user={user} {...limitReachedModal} isFreeUser={!user.hasPaidMail} />
            )}
            {renderCalModal && (
                <PersonalCalendarModal
                    {...calModal}
                    calendars={allCalendars}
                    defaultCalendarID={calendarUserSettings.DefaultCalendarID}
                    onCreateCalendar={onCreateCalendar}
                />
            )}
        </>
    );
};
