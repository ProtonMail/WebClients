import { ReactNode, Ref, useCallback, useEffect, useMemo, useState } from 'react';

import { differenceInCalendarDays, format, isToday } from 'date-fns';
import { c, msgid } from 'ttag';

import { Button, CircleLoader } from '@proton/atoms';
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
    LocalizedMiniCalendar,
    MainLogo,
    PrimaryButton,
    PrivateAppContainer,
    PrivateHeader,
    PrivateMainArea,
    RebrandingFeedbackModal,
    SettingsLink,
    Spotlight,
    TimeZoneSelector,
    Tooltip,
    TopBanners,
    TopNavbarListItemContactsDropdown,
    TopNavbarListItemFeedbackButton,
    TopNavbarListItemSettingsDropdown,
    UserDropdown,
    useContactGroups,
    useDrawer,
    useHasRebrandingFeedback,
    useModalState,
    useNotifications,
    useOpenDrawerOnLoad,
    useSpotlightOnFeature,
    useSpotlightShow,
    useToggle,
    useWelcomeFlags,
} from '@proton/components';
import CalendarSelectIcon from '@proton/components/components/calendarSelect/CalendarSelectIcon';
import DrawerVisibilityButton from '@proton/components/components/drawer/DrawerVisibilityButton';
import {
    CONTACT_WIDGET_TABS,
    CustomAction,
    CustomActionRenderProps,
} from '@proton/components/containers/contacts/widget/types';
import useDisplayContactsWidget from '@proton/components/hooks/useDisplayContactsWidget';
import { getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import { emailToAttendee } from '@proton/shared/lib/calendar/attendees';
import { CALENDAR_SETTINGS_SECTION_ID, MAXIMUM_DATE, MINIMUM_DATE, VIEWS } from '@proton/shared/lib/calendar/constants';
import { getDefaultView } from '@proton/shared/lib/calendar/getSettings';
import { getGeneralSettingsPath } from '@proton/shared/lib/calendar/settingsRoutes';
import { APPS, CALENDAR_APP_NAME } from '@proton/shared/lib/constants';
import { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';
import { fromUTCDate, toLocalDate } from '@proton/shared/lib/date/timezone';
import { isAppInView } from '@proton/shared/lib/drawer/helpers';
import { canonicalizeInternalEmail, validateEmailAddress } from '@proton/shared/lib/helpers/email';
import { dateLocale } from '@proton/shared/lib/i18n';
import { Address } from '@proton/shared/lib/interfaces';
import { AttendeeModel, CalendarUserSettings, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import isTruthy from '@proton/utils/isTruthy';
import uniqueBy from '@proton/utils/uniqueBy';

import DateCursorButtons from '../../components/DateCursorButtons';
import ViewSelector from '../../components/ViewSelector';
import getDateRangeText from '../../components/getDateRangeText';
import CalendarOnboardingModal from '../../components/onboarding/CalendarOnboardingModal';
import { getNoonDateForTimeZoneOffset } from '../../helpers/date';
import { getIsCalendarAppInDrawer } from '../../helpers/views';
import CalendarSidebar from './CalendarSidebar';
import CalendarToolbar from './CalendarToolbar';
import getDateDiff from './getDateDiff';
import { toUrlParams } from './getUrlHelper';

/**
 * Converts a local date into the corresponding UTC date at 0 hours.
 */
const localToUtcDate = (date: Date) => new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

interface Props {
    calendars: VisualCalendar[];
    onCreateCalendarFromSidebar?: (id: string) => void;
    isLoading?: boolean;
    isNarrow?: boolean;
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
    onCreateEvent?: (attendees?: AttendeeModel[]) => void;
    onClickToday: () => void;
    onChangeView: (view: VIEWS) => void;
    onChangeDate: (date: Date) => void;
    onChangeDateRange: (date: Date, range: number, resetRange?: boolean) => void;
    containerRef: Ref<HTMLDivElement>;
    addresses: Address[];
    calendarUserSettings: CalendarUserSettings;
}

const CalendarContainerView = ({
    calendars,
    onCreateCalendarFromSidebar,
    isLoading = false,
    isNarrow = false,
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

    onCreateEvent,
    onClickToday,
    onChangeView,
    onChangeDate,
    onChangeDateRange,

    children,
    containerRef,

    addresses,

    calendarUserSettings,
}: Props) => {
    const [showIframeMiniCalendar, setShowIframeMiniCalendar] = useState<boolean>(false);
    const { state: expanded, toggle: onToggleExpand, set: setExpand } = useToggle();
    const { createNotification } = useNotifications();
    const [groups = []] = useContactGroups();
    const hasRebrandingFeedback = useHasRebrandingFeedback();
    const [onboardingModal, setOnboardingModal, renderOnboardingModal] = useModalState();
    const [rebrandingFeedbackModal, setRebrandingFeedbackModal] = useModalState();

    useOpenDrawerOnLoad();
    const displayContactsInHeader = useDisplayContactsWidget();
    const { showDrawerSidebar, appInView } = useDrawer();

    const isDrawerApp = getIsCalendarAppInDrawer(view);
    const defaultView = getDefaultView(calendarUserSettings);

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

    const handleSelectDateRange = useCallback(([start, end]: [Date, Date], resetRange?: boolean) => {
        const numberOfDays = differenceInCalendarDays(end, start);
        const newDate = localToUtcDate(start);
        onChangeDateRange(newDate, numberOfDays, resetRange);
    }, []);

    const handleClickLocalDate = useCallback(
        (newDate) => {
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

    const top = !isDrawerApp && <TopBanners />;

    const logo = <MainLogo to="/" />;

    const [{ isWelcomeFlow }] = useWelcomeFlags();
    const { show, onDisplayed } = useSpotlightOnFeature(
        FeatureCode.SpotlightAutoAddedInvites,
        !isWelcomeFlow && !isNarrow,
        {
            alpha: Date.UTC(2021, 7, 24, 12),
            beta: Date.UTC(2021, 7, 24, 12),
            default: Date.UTC(2022, 7, 24, 10),
        }
    );
    const shouldShowSpotlight = useSpotlightShow(show);
    const goToSettingsLink = (
        <SettingsLink
            path={getGeneralSettingsPath({ sectionId: CALENDAR_SETTINGS_SECTION_ID.INVITATIONS })}
            app={APPS.PROTONCALENDAR}
            key="settings-link"
        >{c('Spotlight settings link').t`Go to settings`}</SettingsLink>
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
                        <Button
                            icon
                            className="mr0-5 inline-flex pt0-5 pb0-5"
                            onClick={onClick}
                            disabled={noSelection || !onCreateEvent}
                            title={createEventText}
                        >
                            <Icon name="calendar-grid" alt={createEventText} />
                        </Button>
                    </Tooltip>
                );
            },
            tabs: [CONTACT_WIDGET_TABS.CONTACTS, CONTACT_WIDGET_TABS.GROUPS],
        },
    ];

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
            {renderOnboardingModal && <CalendarOnboardingModal showGenericSteps {...onboardingModal} />}
            <PrivateHeader
                userDropdown={<UserDropdown onOpenIntroduction={() => setOnboardingModal(true)} />}
                settingsButton={
                    <Spotlight
                        type="new"
                        show={shouldShowSpotlight}
                        onDisplayed={onDisplayed}
                        content={
                            <div style={{ maxWidth: 240 }}>
                                <div className="text-lg text-bold mb0-25">{c('Spotlight')
                                    .t`Easily accept invites`}</div>
                                <p className="m0">
                                    {c('Spotlight')
                                        .jt`Now invitations appear in your calendar as pending events. Just open an event to respond. ${goToSettingsLink}`}
                                </p>
                            </div>
                        }
                    >
                        <div>
                            <TopNavbarListItemSettingsDropdown
                                to={`/${getSlugFromApp(APPS.PROTONCALENDAR)}`}
                                toApp={APPS.PROTONACCOUNT}
                            />
                        </div>
                    </Spotlight>
                }
                floatingButton={
                    <FloatingButton onClick={() => onCreateEvent?.()}>
                        <Icon size={24} name="plus" className="mauto" />
                    </FloatingButton>
                }
                contactsButton={
                    displayContactsInHeader && (
                        <TopNavbarListItemContactsDropdown customActions={contactCustomActions} />
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
                isNarrow={isNarrow}
            />

            <RebrandingFeedbackModal {...rebrandingFeedbackModal} />
        </>
    );

    const footerButtons = [
        <PrimaryButton key="footer-button-1" onClick={() => onCreateEvent?.()} disabled={!onCreateEvent}>
            {createEventText}
        </PrimaryButton>,
        <AppLink key="footer-button-2" to={toLink} selfOpening className="button button-outline-weak">
            {c('Link to calendar app').t`Open in ${CALENDAR_APP_NAME}`}
        </AppLink>,
    ];

    const bottom = isDrawerApp ? <DrawerAppFooter buttons={footerButtons} /> : undefined;

    const sidebar = (
        <CalendarSidebar
            calendars={calendars}
            addresses={addresses}
            logo={logo}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            onCreateEvent={onCreateEvent ? () => onCreateEvent?.() : undefined}
            onCreateCalendar={onCreateCalendarFromSidebar}
            calendarUserSettings={calendarUserSettings}
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
        />
    );

    const loader = isLoading ? (
        <div className="calendar-loader-container">
            <div className="notification" role="alert">
                <span className="notification__content">
                    <span>{c('Info').t`Loading events`}</span>
                    <CircleLoader srLabelHidden={true} />
                </span>
            </div>
        </div>
    ) : null;

    const currentRange = useMemo(() => {
        return getDateRangeText(view, range, localDate, localDateRange);
    }, [view, range, localDate, localDateRange]);

    const noonDate = getNoonDateForTimeZoneOffset(utcDateRangeInTimezone ? utcDateRangeInTimezone[0] : localNowDate);

    const drawerSidebarButtons = [
        <ContactDrawerAppButton aria-expanded={isAppInView(APPS.PROTONCONTACTS, appInView)} />,
    ].filter(isTruthy);

    const canShowDrawer = !isDrawerApp && drawerSidebarButtons.length > 0;

    return (
        <PrivateAppContainer
            top={top}
            header={header}
            bottom={bottom}
            sidebar={sidebar}
            containerRef={containerRef}
            mainNoBorder={isDrawerApp}
            drawerSidebar={<DrawerSidebar buttons={drawerSidebarButtons} />}
            drawerVisibilityButton={canShowDrawer ? <DrawerVisibilityButton /> : undefined}
            drawerApp={isDrawerApp ? null : <DrawerApp contactCustomActions={contactCustomActions} />}
            mainBordered={canShowDrawer && showDrawerSidebar}
        >
            <div className="only-print p1">
                {tzid} <br />
                {calendars
                    .filter((calendar) => calendar.Display)
                    .map(({ Color, Name, ID }) => (
                        <span className="flex flex-align-items-center" key={ID}>
                            <CalendarSelectIcon color={Color} className="keep-color mr0-75" /> {Name}
                        </span>
                    ))}
                <br />
                {currentRange}
            </div>
            {!isDrawerApp && (
                <CalendarToolbar
                    dateCursorButtons={
                        <DateCursorButtons
                            view={view}
                            currentRange={currentRange}
                            now={localNowDate}
                            onToday={onClickToday}
                            onNext={handleClickNext}
                            onPrev={handleClickPrev}
                        />
                    }
                    viewSelector={
                        <ViewSelector
                            data-test-id="calendar-view:view-options"
                            view={view}
                            range={range}
                            onChange={onChangeView}
                        />
                    }
                    timezoneSelector={
                        <TimeZoneSelector
                            data-test-id="calendar-view:time-zone-dropdown"
                            className="no-mobile no-tablet"
                            date={noonDate}
                            timezone={tzid}
                            onChange={setTzid}
                        />
                    }
                />
            )}
            <PrivateMainArea hasToolbar data-test-id="calendar-view:events-area">
                {loader}
                {children}
            </PrivateMainArea>
        </PrivateAppContainer>
    );
};

export default CalendarContainerView;
