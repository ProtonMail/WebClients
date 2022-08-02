import { useState } from 'react';
import { c } from 'ttag';

import {
    Button,
    Checkbox,
    classnames,
    Icon,
    SettingsLink,
    SidebarListItem,
    SidebarListItemContent,
    SidebarListItemDiv,
    SimpleDropdown,
    DropdownMenuLink,
    Tooltip,
    useUser,
    useModalState,
} from '@proton/components';
import noop from '@proton/utils/noop';
import { VisualCalendar, SubscribedCalendar } from '@proton/shared/lib/interfaces/calendar';
import { getIsCalendarDisabled, getProbablyActiveCalendars } from '@proton/shared/lib/calendar/calendar';

import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import { CalendarModal } from '@proton/components/containers/calendar/calendarModal/CalendarModal';
import {
    getCalendarHasSubscriptionParameters,
    getCalendarIsNotSyncedInfo,
    getIsPersonalCalendar,
} from '@proton/shared/lib/calendar/subscribe/helpers';
import { ImportModal } from '@proton/components/containers/calendar/importModal';

import { Nullable } from '@proton/shared/lib/interfaces';
import { CALENDAR_SETTINGS_SUBSECTION_ID, COLORS } from '@proton/shared/lib/calendar/constants';

export interface CalendarSidebarListItemsProps {
    calendars?: VisualCalendar[] | SubscribedCalendar[];
    loading?: boolean;
    onChangeVisibility: (id: string, checked: boolean) => void;
    actionsDisabled?: boolean;
}

const CalendarSidebarListItems = ({
    calendars = [],
    loading = false,
    onChangeVisibility = noop,
    actionsDisabled = false,
}: CalendarSidebarListItemsProps) => {
    const [user] = useUser();
    const [importModalCalendar, setImportModalCalendar] = useState<Nullable<VisualCalendar>>(null);
    const [calendarModalCalendar, setCalendarModalCalendar] = useState<Nullable<VisualCalendar>>(null);

    const [
        {
            open: isCalendarModalOpen,
            onClose: onCloseCalendarModal,
            onExit: onExitCalendarModal,
            ...calendarModalProps
        },
        setIsCalendarModalOpen,
    ] = useModalState();

    const [
        { open: isImportModalOpen, onClose: onCloseImportModal, onExit: onExitImportModal, ...importModalProps },
        setIsImportModalOpen,
    ] = useModalState();

    if (calendars.length === 0) {
        return null;
    }

    const isPersonalCalendar = getIsPersonalCalendar(calendars[0]);

    const result = calendars.map((calendar, i) => {
        const { ID, Name, Display, Color } = calendar;
        const isCalendarDisabled = getIsCalendarDisabled(calendar);

        const left = (
            <Checkbox
                className="mr0-25 flex-item-noshrink"
                color={COLORS.WHITE}
                backgroundColor={Display ? Color : 'transparent'}
                borderColor={Color}
                checked={!!Display}
                disabled={loading}
                aria-describedby={`calendar-${i}`}
                onChange={({ target: { checked } }) => onChangeVisibility(ID, checked)}
            />
        );

        const isNotSyncedInfo = getCalendarHasSubscriptionParameters(calendar)
            ? getCalendarIsNotSyncedInfo(calendar)
            : undefined;

        return (
            <SidebarListItem key={ID}>
                <SidebarListItemDiv className="calendar-sidebar-list-item opacity-on-hover-container pt0-5 pb0-5 pr0-5">
                    <SidebarListItemContent
                        data-test-id="calendar-sidebar:user-calendars"
                        left={left}
                        className={classnames(['flex', (isCalendarDisabled || isNotSyncedInfo) && 'color-weak'])}
                    >
                        <div className="flex flex-nowrap flex-justify-space-between flex-align-items-center w100">
                            <div className="flex flex-nowrap mr0-5">
                                <div className="text-ellipsis" title={Name}>
                                    {Name}
                                </div>
                                {!isCalendarDisabled && isNotSyncedInfo && (
                                    <div className="flex-item-noshrink">
                                        &nbsp;
                                        <Tooltip title={isNotSyncedInfo.text}>
                                            <span>({isNotSyncedInfo.label})</span>
                                        </Tooltip>
                                    </div>
                                )}
                                {isCalendarDisabled && (
                                    <div className="flex-item-noshrink">
                                        &nbsp;({c('Disabled calendar name suffix').t`Disabled`})
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
                                    className="calendar-sidebar-list-item-action opacity-on-hover flex-item-noshrink no-mobile"
                                    loading={actionsDisabled}
                                    content={<Icon name="three-dots-horizontal" />}
                                >
                                    <DropdownMenu>
                                        <DropdownMenuButton
                                            className="text-left"
                                            onClick={() => {
                                                setCalendarModalCalendar(calendar);
                                                setIsCalendarModalOpen(true);
                                            }}
                                        >
                                            {c('Action').t`Edit`}
                                        </DropdownMenuButton>
                                        {isPersonalCalendar && user.hasPaidMail && (
                                            <DropdownMenuLink
                                                as={SettingsLink}
                                                path={`/calendars?share=${calendar.ID}`}
                                            >
                                                {c('Action').t`Share`}
                                            </DropdownMenuLink>
                                        )}
                                        {isPersonalCalendar && !isCalendarDisabled && (
                                            <DropdownMenuButton
                                                className="text-left"
                                                onClick={() => {
                                                    if (user.hasNonDelinquentScope) {
                                                        setImportModalCalendar(calendar);
                                                        setIsImportModalOpen(true);
                                                    }
                                                }}
                                            >
                                                {c('Action').t`Import events`}
                                            </DropdownMenuButton>
                                        )}
                                        <hr className="mt0-5 mb0-5" />
                                        <DropdownMenuLink
                                            as={SettingsLink}
                                            path={`/calendars#${isPersonalCalendar
                                                ? CALENDAR_SETTINGS_SUBSECTION_ID.PERSONAL_CALENDARS
                                                : CALENDAR_SETTINGS_SUBSECTION_ID.SUBSCRIBED_CALENDARS
                                            }`}
                                        >
                                            {c('Calendar sidebar dropdown item').t`More options`}
                                        </DropdownMenuLink>
                                    </DropdownMenu>
                                </SimpleDropdown>
                            </Tooltip>
                        </div>
                    </SidebarListItemContent>
                </SidebarListItemDiv>
            </SidebarListItem>
        );
    });

    return (
        <>
            {!!calendarModalCalendar && (
                <CalendarModal
                    {...calendarModalProps}
                    open={isCalendarModalOpen}
                    onClose={onCloseCalendarModal}
                    onExit={() => {
                        setCalendarModalCalendar(null);
                        onExitCalendarModal?.();
                    }}
                    calendar={calendarModalCalendar}
                />
            )}

            {!!importModalCalendar && (
                <ImportModal
                    {...importModalProps}
                    isOpen={isImportModalOpen}
                    onClose={onCloseImportModal}
                    onExit={() => {
                        onExitImportModal?.();
                        setImportModalCalendar(null);
                    }}
                    defaultCalendar={importModalCalendar}
                    calendars={getProbablyActiveCalendars(calendars)}
                />
            )}
            {result}
        </>
    );
};

export default CalendarSidebarListItems;
