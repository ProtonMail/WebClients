import type { ReactNode, Ref } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { differenceInCalendarDays, format, isToday } from 'date-fns';
import { c, msgid } from 'ttag';

import { Button, ButtonLike, CircleLoader } from '@proton/atoms';
import {
    AppLink,
    ContactDrawerAppButton,
    DrawerApp,
    DrawerAppFooter,
    DrawerAppHeader,
    DrawerAppHeaderCustomTitle,
    DrawerSidebar,
    FeatureCode,
    FloatingButton,
    Icon,
    InboxDesktopFreeTrialTopBanner,
    InboxDesktopOutdatedAppTopBanner,
    LocalizedMiniCalendar,
    PrimaryButton,
    PrivateAppContainer,
    PrivateHeader,
    PrivateMainArea,
    QuickSettingsAppButton,
    RebrandingFeedbackModal,
    ToolbarButton,
    Tooltip,
    TopBanners,
    TopNavbarListItemFeedbackButton,
    UserDropdown,
    useContactGroups,
    useDrawer,
    useFeature,
    useHasRebrandingFeedback,
    useModalState,
    useNotifications,
    useOpenDrawerOnLoad,
    useToggle,
    useUser,
} from '@proton/components';
import CalendarSelectIcon from '@proton/components/components/calendarSelect/CalendarSelectIcon';
import DrawerVisibilityButton from '@proton/components/components/drawer/DrawerVisibilityButton';
import type { CustomAction, CustomActionRenderProps } from '@proton/components/containers/contacts/widget/types';
import { CONTACT_WIDGET_TABS } from '@proton/components/containers/contacts/widget/types';
import { emailToAttendee } from '@proton/shared/lib/calendar/attendees';
import { MAXIMUM_DATE, MINIMUM_DATE, VIEWS } from '@proton/shared/lib/calendar/constants';
import { getDefaultView } from '@proton/shared/lib/calendar/getSettings';
import { APPS, CALENDAR_APP_NAME } from '@proton/shared/lib/constants';
import type { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';
import { fromUTCDate, toLocalDate } from '@proton/shared/lib/date/timezone';
import { isAppInView } from '@proton/shared/lib/drawer/helpers';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import { canonicalizeInternalEmail, validateEmailAddress } from '@proton/shared/lib/helpers/email';
import { dateLocale } from '@proton/shared/lib/i18n';
import type { Address } from '@proton/shared/lib/interfaces';
import type { AttendeeModel, CalendarUserSettings, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import isTruthy from '@proton/utils/isTruthy';
import uniqueBy from '@proton/utils/uniqueBy';

import DateCursorButtons from '../../components/DateCursorButtons';
import ViewSelector from '../../components/ViewSelector';
import CalendarQuickSettings from '../../components/drawer/CalendarQuickSettings';
import getDateRangeText from '../../components/getDateRangeText';
import { getNoonDateForTimeZoneOffset } from '../../helpers/date';
import { getIsCalendarAppInDrawer } from '../../helpers/views';
import CalendarSidebar from './CalendarSidebar';
import CalendarToolbar from './CalendarToolbar';
import getDateDiff from './getDateDiff';
import { toUrlParams } from './getUrlHelper';
import CalendarSearch from './search/CalendarSearch';
import { useCalendarSearch } from './search/CalendarSearchProvider';

/**
 * Converts a local date into the corresponding UTC date at 0 hours.
 */
const localToUtcDate = (date: Date) => new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

interface Props {
    calendars: VisualCalendar[];
    isLoading?: boolean;
    isSmallViewport?: boolean;
    displayWeekNumbers?: boolean;
    weekStartsOn?: WeekStartsOn;
    tzid: string;
    setTzid: (tzid: string) => void;
    range?: number;
    children: ReactNode;
    view: VIEWS;
    utcDefaultDate: Date;
    utcDate: Date;
    utcDateRange: Date[];
    utcDateRangeInTimezone?: Date[];
    onCreateCalendarFromSidebar: (id: string) => void;
    onCreateEvent?: (attendees?: AttendeeModel[]) => void;
    onBackFromSearch: () => void;
    onClickToday: () => void;
    onChangeView: (view: VIEWS) => void;
    onChangeDate: (date: Date) => void;
    onChangeDateRange: (date: Date, range: number, resetRange?: boolean) => void;
    containerRef: HTMLDivElement | null;
    setContainerRef: Ref<HTMLDivElement>;
    onSearch: () => void;
    addresses: Address[];
    calendarUserSettings: CalendarUserSettings;
    isAskUpdateTimezoneModalOpen?: boolean;
}

const CalendarContainerView = ({
    calendars,
    isLoading = false,
    isSmallViewport = false,
    displayWeekNumbers = false,
    weekStartsOn = 0,

    tzid,
    setTzid,

    range = 0,
    view,
    utcDefaultDate,
    utcDate,
    utcDateRange,
    utcDateRangeInTimezone,

    onCreateCalendarFromSidebar,
    onCreateEvent,
    onBackFromSearch,
    onClickToday,
    onChangeView,
    onChangeDate,
    onChangeDateRange,

    children,
    containerRef,
    setContainerRef,
    onSearch,

    addresses,

    isAskUpdateTimezoneModalOpen,

    calendarUserSettings,
}: Props) => {
    const [showIframeMiniCalendar, setShowIframeMiniCalendar] = useState<boolean>(false);
    const { state: expanded, toggle: onToggleExpand, set: setExpand } = useToggle();
    const { createNotification } = useNotifications();
    const [groups = []] = useContactGroups();
    const hasRebrandingFeedback = useHasRebrandingFeedback();
    const isCalendarEncryptedSearchEnabled = !!useFeature(FeatureCode.CalendarEncryptedSearch).feature?.Value;
    const searchSpotlightAnchorRef = useRef<HTMLButtonElement>(null);
    const [rebrandingFeedbackModal, setRebrandingFeedbackModal] = useModalState();
    const [user] = useUser();

    useOpenDrawerOnLoad();
    const { appInView, showDrawerSidebar } = useDrawer();

    const isDrawerApp = getIsCalendarAppInDrawer(view);
    const isSearchView = view === VIEWS.SEARCH;
    const defaultView = getDefaultView(calendarUserSettings);

    const { isSearching, setIsSearching } = useCalendarSearch();

    const handleBackFromSearch = () => {
        setIsSearching(false);
        onBackFromSearch();
    };

    const toLink = toUrlParams({
        date: utcDate,
        view: defaultView,
        range,
        defaultView,
        defaultDate: utcDefaultDate,
    });

    const localNowDate = useMemo(() => {
        return new Date(utcDefaultDate.getUTCFullYear(), utcDefaultDate.getUTCMonth(), utcDefaultDate.getUTCDate());
    }, [utcDefaultDate]);

    const localDate = useMemo(() => {
        return new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate());
    }, [utcDate]);

    const localDateRange = useMemo((): [Date, Date] => {
        const [utcStart, utcEnd] = utcDateRange;
        return [toLocalDate(fromUTCDate(utcStart)), toLocalDate(fromUTCDate(utcEnd))];
    }, [utcDateRange]);

    const handleSelectDateRange = useCallback(
        ([start, end]: [Date, Date], resetRange?: boolean) => {
            const numberOfDays = differenceInCalendarDays(end, start);
            const newDate = localToUtcDate(start);
            onChangeDateRange(newDate, numberOfDays, resetRange);
        },
        [onChangeDateRange]
    );

    const handleClickLocalDate = useCallback(
        (newDate: Date) => {
            if (showIframeMiniCalendar) {
                setShowIframeMiniCalendar(false);
            }
            onChangeDate(localToUtcDate(newDate));
        },
        [showIframeMiniCalendar]
    );

    const handleClickNext = useCallback(() => {
        onChangeDate(getDateDiff(utcDate, range, view, 1));
    }, [utcDate, range, view]);

    const handleClickPrev = useCallback(() => {
        onChangeDate(getDateDiff(utcDate, range, view, -1));
    }, [utcDate, range, view]);

    const ownNormalizedEmails = useMemo(() => {
        return addresses.map(({ Email }) => canonicalizeInternalEmail(Email));
    }, [addresses]);

    const getHandleCreateEventFromContacts = ({
        contactList,
        groupsEmailsMap,
        recipients,
        onClose,
        selected,
    }: Omit<CustomActionRenderProps, 'noSelection'>) => {
        const selfInvitationErrorMessage = c('Error').t`Self invitation not allowed`;

        if (contactList) {
            return () => {
                const { contactEmailsMap, contacts } = contactList;
                const noEmailsContactIDs = selected.filter((contactID) => !contactEmailsMap[contactID]?.length);
                const invalidEmailContactIDs = selected.flatMap((contactID) => {
                    const email = contactEmailsMap[contactID]?.[0]?.Email;

                    if (email && !validateEmailAddress(email)) {
                        return [contactID];
                    }

                    return [];
                });

                const getContactWarningParts = (contactIDs: string[]) => {
                    const names = contactIDs.map(
                        (contactID) =>
                            contacts.find((contact) => contact.ID === contactID)?.Name ||
                            c('Placeholder for contact with no name').t`(No name)`
                    );

                    return {
                        count: names.length,
                        list: names.join(', '),
                    };
                };

                if (invalidEmailContactIDs.length) {
                    const { count, list } = getContactWarningParts(invalidEmailContactIDs);

                    const text = c('Error').ngettext(
                        msgid`${list} doesn't have a valid email address`,
                        `Some contacts don't have a valid email address: ${list}`,
                        count
                    );

                    createNotification({ type: 'warning', text });
                }

                if (noEmailsContactIDs.length) {
                    const { count, list } = getContactWarningParts(noEmailsContactIDs);

                    const text = c('Error').ngettext(
                        msgid`${list} doesn't have an email address`,
                        `Some contacts have no email addresses: ${list}`,
                        count
                    );

                    createNotification({ type: 'warning', text });
                }

                const contactEmailsOfContacts = uniqueBy(
                    selected
                        .map((contactID) => contactEmailsMap[contactID]?.[0])
                        .filter(isTruthy)
                        .filter(({ Email }) => validateEmailAddress(Email)),
                    ({ Email }) => Email
                );
                const participants = contactEmailsOfContacts.map(({ Email }) => emailToAttendee(Email));
                const participantsWithoutSelf = participants.filter(
                    ({ email }) => !ownNormalizedEmails.includes(canonicalizeInternalEmail(email))
                );

                if (participantsWithoutSelf.length < participants.length) {
                    createNotification({
                        type: 'warning',
                        text: selfInvitationErrorMessage,
                    });
                }

                onCreateEvent?.(participantsWithoutSelf);
                onClose?.();
            };
        }

        if (groupsEmailsMap && recipients) {
            return () => {
                const noContactGroupIDs = selected.filter((groupID) => !groupsEmailsMap[groupID]?.length);
                const invalidEmailGroupIDs = selected.filter((groupID) => {
                    const email = groupsEmailsMap[groupID]?.[0]?.Email;

                    if (!email) {
                        return false;
                    }

                    return !validateEmailAddress(email);
                });

                const getGroupWarningParts = (groupIDs: string[]) => {
                    const names = groupIDs.map((groupID) => groups.find((group) => group.ID === groupID)?.Name);

                    return {
                        count: names.length,
                        list: names.join(', '),
                    };
                };

                if (invalidEmailGroupIDs.length) {
                    const { count, list } = getGroupWarningParts(invalidEmailGroupIDs);

                    const text = c('Error').ngettext(
                        msgid`${list} has invalid emails`,
                        `Some groups have invalid emails: ${list}`,
                        count
                    );

                    createNotification({ type: 'warning', text });
                }

                if (noContactGroupIDs.length) {
                    const { count, list } = getGroupWarningParts(noContactGroupIDs);

                    const text = c('Error').ngettext(
                        msgid`${list} has no contacts`,
                        `Some groups have no contacts: ${list}`,
                        count
                    );

                    createNotification({ type: 'warning', text });
                }

                const participants = uniqueBy(
                    selected
                        .flatMap((contactID) => {
                            const group = groupsEmailsMap[contactID];

                            if (group) {
                                return group.flatMap(({ Email }) => {
                                    if (!validateEmailAddress(Email)) {
                                        return [];
                                    }

                                    if (!ownNormalizedEmails.includes(canonicalizeInternalEmail(Email))) {
                                        return [emailToAttendee(Email)];
                                    }

                                    createNotification({
                                        type: 'warning',
                                        text: selfInvitationErrorMessage,
                                    });

                                    return [];
                                });
                            }

                            return null;
                        })
                        .filter(isTruthy),
                    ({ email }) => email
                );

                onCreateEvent?.(participants);
                onClose?.();
            };
        }
    };

    useEffect(() => {
        setExpand(false);
    }, [window.location.pathname]);

    const top = !isDrawerApp && (
        <>
            {isElectronMail && <InboxDesktopOutdatedAppTopBanner />}
            {isElectronMail && !user.hasPaidMail && <InboxDesktopFreeTrialTopBanner />}
            <TopBanners app={APPS.PROTONCALENDAR} />
        </>
    );

    const createEventText = c('Action').t`Create event`;

    const contactCustomActions: CustomAction[] = [
        {
            render: ({ contactList, groupsEmailsMap, recipients, noSelection, onClose, selected }) => {
                const onClick = getHandleCreateEventFromContacts({
                    contactList,
                    groupsEmailsMap,
                    recipients,
                    onClose,
                    selected,
                });

                if (!onClick) {
                    return null;
                }

                return (
                    <Tooltip key="createEvent" title={createEventText}>
                        <Button icon className="inline-flex" onClick={onClick} disabled={noSelection || !onCreateEvent}>
                            <Icon name="calendar-grid" alt={createEventText} />
                        </Button>
                    </Tooltip>
                );
            },
            tabs: [CONTACT_WIDGET_TABS.CONTACTS, CONTACT_WIDGET_TABS.GROUPS],
        },
    ];

    const currentRange = useMemo(() => {
        return getDateRangeText(view, range, localDate, localDateRange);
    }, [view, range, localDate, localDateRange]);

    const noonDate = getNoonDateForTimeZoneOffset({
        date: utcDateRangeInTimezone ? utcDateRangeInTimezone[0] : localNowDate,
        dateTzid: tzid,
        targetTzid: calendarUserSettings.PrimaryTimezone,
    });

    const handleClickSearch = () => {
        setIsSearching(true);
    };

    const toolbar = (
        <CalendarToolbar
            date={noonDate}
            timezone={tzid}
            setTzid={setTzid}
            telemetrySource="temporary_timezone"
            hideTimeZoneSelector={isSearching}
            dateCursorButtons={
                !isSearching && (
                    <DateCursorButtons
                        view={view}
                        currentRange={currentRange}
                        now={localNowDate}
                        onToday={onClickToday}
                        onNext={handleClickNext}
                        onPrev={handleClickPrev}
                    />
                )
            }
            viewSelector={
                !isSearching && (
                    <ViewSelector
                        data-testid="calendar-view:view-options-dropdown"
                        view={view}
                        range={range}
                        onChange={onChangeView}
                    />
                )
            }
            searchButton={
                isCalendarEncryptedSearchEnabled &&
                !isSearching && (
                    <ToolbarButton
                        ref={searchSpotlightAnchorRef}
                        icon={<Icon name="magnifier" alt={c('Action').t`Search`} />}
                        title={c('Header').t`Search`}
                        onClick={handleClickSearch}
                    />
                )
            }
            searchField={
                isSearching && (
                    <CalendarSearch
                        containerRef={containerRef}
                        onSearch={onSearch}
                        onBackFromSearch={handleBackFromSearch}
                    />
                )
            }
        />
    );

    const drawerSettingsButton = (
        <QuickSettingsAppButton aria-expanded={isAppInView(DRAWER_NATIVE_APPS.QUICK_SETTINGS, appInView)} />
    );

    const header = isDrawerApp ? (
        <DrawerAppHeader
            title={
                <DrawerAppHeaderCustomTitle
                    dropdownTitle={format(localDate, 'PP', { locale: dateLocale })}
                    onToggleDropdown={() => setShowIframeMiniCalendar(!showIframeMiniCalendar)}
                    onCloseDropdown={() => setShowIframeMiniCalendar(false)}
                    buttonColor={isToday(localDate) ? 'norm' : undefined}
                    dropdownExpanded={showIframeMiniCalendar}
                />
            }
            customDropdown={
                showIframeMiniCalendar ? (
                    <LocalizedMiniCalendar
                        onSelectDate={handleClickLocalDate}
                        date={localDate}
                        now={localNowDate}
                        displayWeekNumbers={false}
                        weekStartsOn={weekStartsOn}
                    />
                ) : undefined
            }
            onCloseDropdown={() => setShowIframeMiniCalendar(false)}
        />
    ) : (
        <>
            <PrivateHeader
                app={APPS.PROTONCALENDAR}
                userDropdown={<UserDropdown app={APPS.PROTONCALENDAR} />}
                floatingButton={
                    !isSearchView && (
                        <FloatingButton onClick={() => onCreateEvent?.()}>
                            <Icon size={6} name="plus" className="m-auto" />
                        </FloatingButton>
                    )
                }
                feedbackButton={
                    hasRebrandingFeedback ? (
                        <TopNavbarListItemFeedbackButton onClick={() => setRebrandingFeedbackModal(true)} />
                    ) : null
                }
                title={c('Title').t`Calendar`}
                expanded={expanded}
                onToggleExpand={onToggleExpand}
                isSmallViewport={isSmallViewport}
                actionArea={!isDrawerApp ? toolbar : null}
                hideUpsellButton={isSmallViewport}
                settingsButton={drawerSettingsButton}
            />

            <RebrandingFeedbackModal {...rebrandingFeedbackModal} />
        </>
    );

    const footerButtons = [
        <PrimaryButton
            key="footer-button-1"
            onClick={() => onCreateEvent?.()}
            disabled={!onCreateEvent}
            data-testid="calendar-drawer:create-event-button"
        >
            {createEventText}
        </PrimaryButton>,
        <ButtonLike
            as={AppLink}
            key="footer-button-2"
            to={toLink}
            reloadDocument
            data-testid="calendar-drawer:open-in-app-button"
        >
            {c('Link to calendar app').t`Open in ${CALENDAR_APP_NAME}`}
        </ButtonLike>,
    ];

    const bottom = isDrawerApp ? <DrawerAppFooter offsetNotifications buttons={footerButtons} /> : undefined;

    const sidebar = (
        <CalendarSidebar
            calendars={calendars}
            addresses={addresses}
            calendarUserSettings={calendarUserSettings}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            onCreateEvent={onCreateEvent ? () => onCreateEvent?.() : undefined}
            onCreateCalendar={onCreateCalendarFromSidebar}
            miniCalendar={
                <LocalizedMiniCalendar
                    min={MINIMUM_DATE}
                    max={MAXIMUM_DATE}
                    onSelectDateRange={handleSelectDateRange}
                    onSelectDate={handleClickLocalDate}
                    date={localDate}
                    now={localNowDate}
                    displayWeekNumbers={displayWeekNumbers}
                    dateRange={view === VIEWS.WEEK || range > 0 ? localDateRange : undefined}
                    weekStartsOn={weekStartsOn}
                />
            }
            isAskUpdateTimezoneModalOpen={isAskUpdateTimezoneModalOpen}
        />
    );

    const loader =
        isLoading && !isSearchView ? (
            <div className="calendar-loader-container">
                <div className="notification" role="alert">
                    <span className="notification__content">
                        <span>{c('Info').t`Loading events`}</span>
                        <CircleLoader srLabelHidden={true} />
                    </span>
                </div>
            </div>
        ) : null;

    const drawerSidebarButtons = [
        <ContactDrawerAppButton aria-expanded={isAppInView(DRAWER_NATIVE_APPS.CONTACTS, appInView)} />,
    ].filter(isTruthy);

    const canShowDrawer = !isDrawerApp && drawerSidebarButtons.length > 0;

    return (
        <PrivateAppContainer
            top={top}
            bottom={bottom}
            sidebar={sidebar}
            header={header}
            containerRef={setContainerRef}
            drawerSidebar={<DrawerSidebar buttons={drawerSidebarButtons} />}
            drawerApp={
                isDrawerApp ? null : (
                    <DrawerApp
                        contactCustomActions={contactCustomActions}
                        customAppSettings={<CalendarQuickSettings onBackFromSearch={onBackFromSearch} />}
                    />
                )
            }
        >
            <div className="only-print p-4">
                {tzid} <br />
                {calendars
                    .filter((calendar) => calendar.Display)
                    .map(({ Color, Name, ID }) => (
                        <span className="flex items-center" key={ID}>
                            <CalendarSelectIcon color={Color} className="keep-color mr-3" /> {Name}
                        </span>
                    ))}
                <br />
                {currentRange}
            </div>

            <PrivateMainArea
                hasToolbar
                data-testid="calendar-view:events-area"
                drawerSidebar={<DrawerSidebar buttons={drawerSidebarButtons} />}
                drawerVisibilityButton={canShowDrawer ? <DrawerVisibilityButton /> : undefined}
                isDrawerApp={isDrawerApp}
                mainBordered={canShowDrawer && !!showDrawerSidebar}
            >
                {loader}
                {children}
            </PrivateMainArea>
        </PrivateAppContainer>
    );
};

export default CalendarContainerView;
