import { c } from 'ttag';

import { Button, CircleLoader } from '@proton/atoms';
import {
    Checkbox,
    DropdownMenu,
    DropdownMenuButton,
    DropdownMenuLink,
    Icon,
    SettingsLink,
    SidebarListItem,
    SidebarListItemContent,
    SidebarListItemLabel,
    SimpleDropdown,
    Tooltip,
    useUser,
} from '@proton/components';
import {
    getIsCalendarDisabled,
    getIsCalendarWritable,
    getIsOwnedCalendar,
    getIsPersonalCalendar,
    getIsSubscribedCalendar,
} from '@proton/shared/lib/calendar/calendar';
import { COLORS } from '@proton/shared/lib/calendar/constants';
import { getCalendarSubpagePath } from '@proton/shared/lib/calendar/settingsRoutes';
import {
    getCalendarHasSubscriptionParameters,
    getCalendarIsNotSyncedInfo,
} from '@proton/shared/lib/calendar/subscribe/helpers';
import { APPS } from '@proton/shared/lib/constants';
import type { SubscribedCalendar, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

interface Props {
    calendar: VisualCalendar | SubscribedCalendar;
    loadingVisibility?: boolean;
    loadingSubscriptionParameters?: boolean;
    onChangeVisibility: (id: string, checked: boolean) => void;
    onOpenImportCalendarModal: (calendar: VisualCalendar | SubscribedCalendar) => void;
    onOpenShareCalendarModal: (calendar: VisualCalendar | SubscribedCalendar) => void;
    onOpenEditCalendarModal: (calendar: VisualCalendar | SubscribedCalendar) => void;
}

const CalendarSidebarListItem = ({
    calendar,
    loadingVisibility = false,
    loadingSubscriptionParameters = false,
    onChangeVisibility = noop,
    onOpenImportCalendarModal,
    onOpenShareCalendarModal,
    onOpenEditCalendarModal,
}: Props) => {
    const [user] = useUser();

    const { ID, Name, Display, Color } = calendar;
    const isPersonalCalendar = getIsPersonalCalendar(calendar);
    const isSubscribedCalendar = getIsSubscribedCalendar(calendar);
    const isCalendarDisabled = getIsCalendarDisabled(calendar);
    const isOwnedCalendar = getIsOwnedCalendar(calendar);
    const isCalendarWritable = getIsCalendarWritable(calendar);

    const leftNode = loadingVisibility ? (
        <div
            className="flex items-center justify-center w-custom ml-custom"
            style={{ '--w-custom': '1.25rem', '--ml-custom': 'calc(var(--space-1) * -1)' }}
        >
            <CircleLoader size="small" color={Color} />
        </div>
    ) : (
        <Checkbox
            className="shrink-0 ml-custom"
            labelProps={{
                'data-testid': `calendar-checkbox-${ID}`,
                style: { '--ml-custom': 'calc(var(--space-1) * -1)' },
            }}
            color={COLORS.WHITE}
            backgroundColor={Display ? Color : 'transparent'}
            borderColor={Color}
            checked={!!Display}
            disabled={loadingVisibility}
            id={`calendar-${ID}`}
            name={`calendar-${Name}`}
            onChange={({ target: { checked } }) => onChangeVisibility(ID, checked)}
            aria-label={
                // translator: <Name> is the calendar name
                c('Info').t`Display events for calendar ${Name}`
            }
        />
    );

    const isNotSyncedInfo = getCalendarHasSubscriptionParameters(calendar)
        ? getCalendarIsNotSyncedInfo(calendar)
        : undefined;

    return (
        <SidebarListItem key={ID}>
            <SidebarListItemLabel
                htmlFor={`calendar-${ID}`}
                className="calendar-sidebar-list-item group-hover-opacity-container"
            >
                <SidebarListItemContent
                    data-testid="calendar-sidebar:user-calendars"
                    left={leftNode}
                    className={clsx(['flex w-full gap-2', (isCalendarDisabled || isNotSyncedInfo) && 'color-weak'])}
                >
                    <div className="flex flex-nowrap justify-space-between items-center w-full relative">
                        <div className="flex flex-nowrap">
                            <div className="text-ellipsis" title={Name}>
                                {Name}
                            </div>
                            {!isCalendarDisabled && isNotSyncedInfo && (
                                <div className="shrink-0 max-w-full text-ellipsis">
                                    &nbsp;
                                    <Tooltip title={isNotSyncedInfo.text}>
                                        <span>({isNotSyncedInfo.label})</span>
                                    </Tooltip>
                                </div>
                            )}
                            {isCalendarDisabled && (
                                <div className="shrink-0">&nbsp;({c('Disabled calendar name suffix').t`Disabled`})</div>
                            )}
                        </div>

                        <Tooltip title={c('Sidebar calendar edit tooltip').t`Manage calendar`}>
                            <SimpleDropdown
                                as={Button}
                                icon
                                hasCaret={false}
                                shape="ghost"
                                size="small"
                                className="calendar-sidebar-list-item-action group-hover:opacity-100 group-hover:opacity-100-no-width ml-2 mr-custom right-0 rounded-sm shrink-0 hidden md:inline-flex"
                                style={{ '--mr-custom': 'calc(var(--space-1) * -1)' }}
                                loading={isSubscribedCalendar && loadingSubscriptionParameters}
                                content={<Icon name="three-dots-horizontal" />}
                            >
                                <DropdownMenu>
                                    <DropdownMenuButton
                                        className="text-left"
                                        onClick={() => {
                                            onOpenEditCalendarModal(calendar);
                                        }}
                                    >
                                        {c('Action').t`Edit`}
                                    </DropdownMenuButton>
                                    {isPersonalCalendar && isOwnedCalendar && user.hasPaidMail && (
                                        <DropdownMenuButton
                                            className="text-left"
                                            onClick={() => {
                                                onOpenShareCalendarModal(calendar);
                                            }}
                                        >
                                            {c('Action').t`Share`}
                                        </DropdownMenuButton>
                                    )}
                                    {isCalendarWritable && !isCalendarDisabled && (
                                        <DropdownMenuButton
                                            className="text-left"
                                            onClick={() => {
                                                if (user.hasNonDelinquentScope) {
                                                    onOpenImportCalendarModal(calendar);
                                                }
                                            }}
                                        >
                                            {c('Action').t`Import events`}
                                        </DropdownMenuButton>
                                    )}
                                    <hr className="my-2" />
                                    <DropdownMenuLink
                                        as={SettingsLink}
                                        app={APPS.PROTONCALENDAR}
                                        path={getCalendarSubpagePath(calendar.ID)}
                                    >
                                        {c('Calendar sidebar dropdown item').t`More options`}
                                    </DropdownMenuLink>
                                </DropdownMenu>
                            </SimpleDropdown>
                        </Tooltip>
                    </div>
                </SidebarListItemContent>
            </SidebarListItemLabel>
        </SidebarListItem>
    );
};

export default CalendarSidebarListItem;
