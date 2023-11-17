import { c } from 'ttag';

import { Button, CircleLoader } from '@proton/atoms';
import {
    Checkbox,
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
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import {
    getIsCalendarDisabled,
    getIsCalendarWritable,
    getIsOwnedCalendar,
    getIsPersonalCalendar,
    getIsSubscribedCalendar,
} from '@proton/shared/lib/calendar/calendar';
import { CALENDAR_SETTINGS_SECTION_ID, COLORS } from '@proton/shared/lib/calendar/constants';
import { getCalendarSubpagePath } from '@proton/shared/lib/calendar/settingsRoutes';
import {
    getCalendarHasSubscriptionParameters,
    getCalendarIsNotSyncedInfo,
} from '@proton/shared/lib/calendar/subscribe/helpers';
import { APPS } from '@proton/shared/lib/constants';
import { SubscribedCalendar, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

interface Props {
    calendar: VisualCalendar | SubscribedCalendar;
    loadingVisibility?: boolean;
    loadingSubscriptionParameters?: boolean;
    isCalendarSharingEnabled: boolean;
    onChangeVisibility: (id: string, checked: boolean) => void;
    onOpenImportCalendarModal: (calendar: VisualCalendar | SubscribedCalendar) => void;
    onOpenShareCalendarModal: (calendar: VisualCalendar | SubscribedCalendar) => void;
    onOpenEditCalendarModal: (calendar: VisualCalendar | SubscribedCalendar) => void;
}

const CalendarSidebarListItem = ({
    calendar,
    loadingVisibility = false,
    loadingSubscriptionParameters = false,
    isCalendarSharingEnabled,
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
            className="flex-item-noshrink ml-custom"
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
                                <div className="flex-item-noshrink max-w-full text-ellipsis">
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
                                className="calendar-sidebar-list-item-action group-hover:opacity-100 group-hover:opacity-100-no-width ml-2 mr-custom right-0 rounded-sm flex-item-noshrink hidden md:inline-flex"
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
                                    {isPersonalCalendar &&
                                        isOwnedCalendar &&
                                        user.hasPaidMail &&
                                        (isCalendarSharingEnabled ? (
                                            <DropdownMenuButton
                                                className="text-left"
                                                onClick={() => {
                                                    onOpenShareCalendarModal(calendar);
                                                }}
                                            >
                                                {c('Action').t`Share`}
                                            </DropdownMenuButton>
                                        ) : (
                                            <DropdownMenuLink
                                                as={SettingsLink}
                                                path={getCalendarSubpagePath(calendar.ID, {
                                                    sectionId: CALENDAR_SETTINGS_SECTION_ID.SHARE,
                                                })}
                                            >
                                                {c('Action').t`Share`}
                                            </DropdownMenuLink>
                                        ))}
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
