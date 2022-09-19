import { ReactNode, Ref, useCallback, useEffect, useMemo, useState } from 'react';

import { differenceInCalendarDays, format, isToday } from 'date-fns';
import { c, msgid } from 'ttag';

import {
    Button,
    FeatureCode,
    FloatingButton,
    Icon,
    LocalizedMiniCalendar,
    MainLogo,
    PrivateAppContainer,
    PrivateHeader,
    PrivateMainArea,
    PrivateSideAppHeader,
    RebrandingFeedbackModal,
    SettingsLink,
    SideAppHeaderTitle,
    Spotlight,
    TextLoader,
    TimeZoneSelector,
    TodayIcon,
    Tooltip,
    TopBanners,
    TopNavbarListItemContactsDropdown,
    TopNavbarListItemFeedbackButton,
    TopNavbarListItemSettingsDropdown,
    UserDropdown,
    useContactGroups,
    useHasRebrandingFeedback,
    useModalState,
    useNotifications,
    useSpotlightOnFeature,
    useSpotlightShow,
    useToggle,
    useWelcomeFlags,
} from '@proton/components';
import CalendarSelectIcon from '@proton/components/components/calendarSelect/CalendarSelectIcon';
import { CONTACT_WIDGET_TABS, CustomActionRenderProps } from '@proton/components/containers/contacts/widget/types';
import { emailToAttendee } from '@proton/shared/lib/calendar/attendees';
import { MAXIMUM_DATE, MINIMUM_DATE, VIEWS } from '@proton/shared/lib/calendar/constants';
import { getDefaultView } from '@proton/shared/lib/calendar/getSettings';
import { APPS } from '@proton/shared/lib/constants';
import { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';
import { fromUTCDate, toLocalDate } from '@proton/shared/lib/date/timezone';
import { canonizeInternalEmail, validateEmailAddress } from '@proton/shared/lib/helpers/email';
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
import { getIsSideApp } from '../../helpers/views';
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
    isBlurred?: boolean;
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
    isBlurred = false,
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

    const isSideApp = getIsSideApp(view);
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
        return addresses.map(({ Email }) => canonizeInternalEmail(Email));
    }, [addresses]);

    const handleClickTodayIframe = () => {
        setShowIframeMiniCalendar(false);
        onClickToday();
    };

    const getHandleCreateEventFromWidget = ({
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
                    ({ email }) => !ownNormalizedEmails.includes(canonizeInternalEmail(email))
                );

                if (participantsWithoutSelf.length < participants.length) {
                    createNotification({
                        type: 'warning',
                        text: selfInvitationErrorMessage,
                    });
                }

                onCreateEvent?.(participantsWithoutSelf);
                onClose();
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

                                    if (!ownNormalizedEmails.includes(canonizeInternalEmail(Email))) {
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
                onClose();
            };
        }
    };

    useEffect(() => {
        setExpand(false);
    }, [window.location.pathname]);

    const top = !isSideApp && <TopBanners />;

    const logo = <MainLogo to="/" />;

    const [{ isWelcomeFlow }] = useWelcomeFlags();
    const { show, onDisplayed } = useSpotlightOnFeature(
        FeatureCode.SpotlightAutoAddedInvites,
        !isWelcomeFlow && !isNarrow
    );
    const shouldShowSpotlight = useSpotlightShow(show);
    const goToSettingsLink = (
        <SettingsLink path="/general#invitations" app={APPS.PROTONCALENDAR} key="settings-link">{c(
            'Spotlight settings link'
        ).t`Go to settings`}</SettingsLink>
    );

    const header = isSideApp ? (
        <PrivateSideAppHeader
            toLink={toLink}
            customTitle={
                <SideAppHeaderTitle
                    dropdownTitle={format(localDate, 'PP', { locale: dateLocale })}
                    onToggleDropdown={() => setShowIframeMiniCalendar(!showIframeMiniCalendar)}
                    onCloseDropdown={() => setShowIframeMiniCalendar(false)}
                    buttonColor={isToday(localDate) ? 'norm' : undefined}
                    dropdownExpanded={showIframeMiniCalendar}
                />
            }
            customActions={
                <Tooltip title={c('Action').t`Today`}>
                    <Button icon color="norm" shape="ghost" onClick={handleClickTodayIframe} className="flex mr0-5">
                        <TodayIcon todayDate={localNowDate.getDate()} />
                    </Button>
                </Tooltip>
            }
            dropdownItem={
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
                logo={logo}
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
                            <TopNavbarListItemSettingsDropdown to="/calendar" toApp={APPS.PROTONACCOUNT} />
                        </div>
                    </Spotlight>
                }
                floatingButton={
                    <FloatingButton onClick={() => onCreateEvent?.()}>
                        <Icon size={24} name="plus" className="mauto" />
                    </FloatingButton>
                }
                contactsButton={
                    <TopNavbarListItemContactsDropdown
                        customActions={[
                            {
                                render: ({
                                    contactList,
                                    groupsEmailsMap,
                                    recipients,
                                    noSelection,
                                    onClose,
                                    selected,
                                }) => {
                                    const onClick = getHandleCreateEventFromWidget({
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
                                        <Tooltip key="createEvent" title={c('Action').t`Create event`}>
                                            <Button
                                                icon
                                                className="mr0-5 inline-flex pt0-5 pb0-5"
                                                onClick={onClick}
                                                disabled={noSelection || !onCreateEvent}
                                                title={c('Action').t`Create event`}
                                            >
                                                <Icon name="calendar-grid" alt={c('Action').t`Create event`} />
                                            </Button>
                                        </Tooltip>
                                    );
                                },
                                tabs: [CONTACT_WIDGET_TABS.CONTACTS, CONTACT_WIDGET_TABS.GROUPS],
                            },
                        ]}
                    />
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

    const sidebar = (
        <CalendarSidebar
            calendars={calendars}
            addresses={addresses}
            logo={logo}
            isNarrow={isNarrow}
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
            <TextLoader className="m0">{c('Info').t`Loading events`}</TextLoader>
        </div>
    ) : null;

    const currentRange = useMemo(() => {
        return getDateRangeText(view, range, localDate, localDateRange);
    }, [view, range, localDate, localDateRange]);

    const noonDate = getNoonDateForTimeZoneOffset(utcDateRangeInTimezone ? utcDateRangeInTimezone[0] : localNowDate);

    return (
        <PrivateAppContainer
            top={top}
            header={header}
            sidebar={sidebar}
            isBlurred={isBlurred}
            containerRef={containerRef}
            mainNoBorder={isSideApp}
        >
            {loader}
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
            {!isSideApp && (
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
                {children}
            </PrivateMainArea>
        </PrivateAppContainer>
    );
};

export default CalendarContainerView;
