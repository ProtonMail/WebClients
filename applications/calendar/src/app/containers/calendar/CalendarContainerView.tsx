import { MAXIMUM_DATE, MINIMUM_DATE, VIEWS } from '@proton/shared/lib/calendar/constants';
import { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';
import React, { ReactNode, Ref, useCallback, useEffect, useMemo } from 'react';
import {
    LocalizedMiniCalendar,
    useToggle,
    TextLoader,
    PrivateHeader,
    PrivateMainArea,
    PrivateAppContainer,
    FloatingButton,
    MainLogo,
    TimezoneSelector,
    Icon,
    TopNavbarListItemSettingsDropdown,
    TopNavbarListItemContactsDropdown,
    TopNavbarListItemFeedbackButton,
    FeedbackModal,
    Tooltip,
    Button,
    useNotifications,
    useContactGroups,
    useFeature,
    FeatureCode,
} from '@proton/components';
import { c, msgid } from 'ttag';
import { differenceInCalendarDays } from 'date-fns';

import { fromUTCDate, toLocalDate } from '@proton/shared/lib/date/timezone';
import { AttendeeModel, Calendar } from '@proton/shared/lib/interfaces/calendar';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import { CONTACT_WIDGET_TABS, CustomActionRenderProps } from '@proton/components/containers/contacts/widget/types';
import { emailToAttendee } from '@proton/shared/lib/calendar/attendees';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { Address } from '@proton/shared/lib/interfaces';
import { canonizeInternalEmail, validateEmailAddress } from '@proton/shared/lib/helpers/email';
import { uniqueBy } from '@proton/shared/lib/helpers/array';
import CalendarSidebar from './CalendarSidebar';
import CalendarToolbar from './CalendarToolbar';
import DateCursorButtons from '../../components/DateCursorButtons';
import ViewSelector from '../../components/ViewSelector';

import getDateDiff from './getDateDiff';

/**
 * Converts a local date into the corresponding UTC date at 0 hours.
 */
const localToUtcDate = (date: Date) => new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

interface Props {
    calendars?: Calendar[];
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
}

const CalendarContainerView = ({
    calendars = [],
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
}: Props) => {
    const { state: expanded, toggle: onToggleExpand, set: setExpand } = useToggle();
    const { createNotification } = useNotifications();
    const [groups = []] = useContactGroups();
    const { feature: featureCalendarFeedbackEnabled } = useFeature(FeatureCode.CalendarFeedbackEnabled);
    const calendarAppName = getAppName(APPS.PROTONCALENDAR);

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

    const handleClickLocalDate = useCallback((newDate) => {
        onChangeDate(localToUtcDate(newDate));
    }, []);

    const handleClickNext = useCallback(() => {
        onChangeDate(getDateDiff(utcDate, range, view, 1));
    }, [utcDate, range, view]);

    const handleClickPrev = useCallback(() => {
        onChangeDate(getDateDiff(utcDate, range, view, -1));
    }, [utcDate, range, view]);

    const ownNormalizedEmails = useMemo(() => {
        return addresses.map(({ Email }) => canonizeInternalEmail(Email));
    }, [addresses]);

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

    const logo = <MainLogo to="/" />;
    const header = (
        <PrivateHeader
            logo={logo}
            settingsButton={<TopNavbarListItemSettingsDropdown to="/calendar" toApp={APPS.PROTONACCOUNT} />}
            floatingButton={
                <FloatingButton onClick={() => onCreateEvent?.()}>
                    <Icon size={24} name="plus" className="mauto" />
                </FloatingButton>
            }
            contactsButton={
                <TopNavbarListItemContactsDropdown
                    customActions={[
                        {
                            render: ({ contactList, groupsEmailsMap, recipients, noSelection, onClose, selected }) => {
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
                                            <Icon name="calendar" />
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
                featureCalendarFeedbackEnabled?.Value ? (
                    <TopNavbarListItemFeedbackButton
                        modal={
                            <FeedbackModal
                                feedbackType="calendar_launch"
                                description={c('Info')
                                    .t`${calendarAppName} has been added to the Proton suite. We would love to hear what you think about it!`}
                                scaleTitle={c('Label')
                                    .t`How likely are you to recommend ${calendarAppName} to a friend or colleague?`}
                                scaleProps={{
                                    fromLabel: c('Label').t`0 - Not likely`,
                                    toLabel: c('Label').t`10 - Extremely likely`,
                                }}
                            />
                        }
                    />
                ) : null
            }
            title={c('Title').t`Calendar`}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            isNarrow={isNarrow}
        />
    );

    const sidebar = (
        <CalendarSidebar
            logo={logo}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            onCreateEvent={onCreateEvent ? () => onCreateEvent?.() : undefined}
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
            calendars={calendars}
        />
    );

    const loader = isLoading ? (
        <div className="calendar-loader-container">
            <TextLoader className="m0">{c('Info').t`Loading events`}</TextLoader>
        </div>
    ) : null;

    return (
        <PrivateAppContainer header={header} sidebar={sidebar} isBlurred={isBlurred} containerRef={containerRef}>
            {loader}
            <CalendarToolbar
                dateCursorButtons={
                    <DateCursorButtons
                        view={view}
                        range={range}
                        dateRange={localDateRange}
                        currentDate={localDate}
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
                    <TimezoneSelector
                        data-test-id="calendar-view:time-zone-dropdown"
                        className="no-mobile no-tablet"
                        date={utcDateRangeInTimezone ? utcDateRangeInTimezone[0] : localNowDate}
                        timezone={tzid}
                        onChange={setTzid}
                    />
                }
            />
            <PrivateMainArea hasToolbar data-test-id="calendar-view:events-area">
                {children}
            </PrivateMainArea>
        </PrivateAppContainer>
    );
};

export default CalendarContainerView;
