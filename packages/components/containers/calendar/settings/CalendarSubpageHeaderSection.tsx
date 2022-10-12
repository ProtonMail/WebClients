import React from 'react';

import { c } from 'ttag';

import { Alert, ButtonLike, Icon, Tooltip, useModalState } from '@proton/components/components';
import CalendarSelectIcon from '@proton/components/components/calendarSelect/CalendarSelectIcon';
import { SettingsSection } from '@proton/components/containers';
import { useContactEmailsCache } from '@proton/components/containers/contacts/ContactEmailsProvider';
import { classnames } from '@proton/components/helpers';
import { CALENDAR_STATUS_TYPE, getCalendarStatusBadges } from '@proton/shared/lib/calendar/badges';
import { getIsOwnedCalendar } from '@proton/shared/lib/calendar/calendar';
import { getCalendarHasSubscriptionParameters } from '@proton/shared/lib/calendar/subscribe/helpers';
import { getContactDisplayNameEmail } from '@proton/shared/lib/contacts/contactEmail';
import { canonicalizeEmail } from '@proton/shared/lib/helpers/email';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { SubscribedCalendar, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import { CALENDAR_MODAL_TYPE, CalendarModal } from '../calendarModal/CalendarModal';
import CalendarBadge from './CalendarBadge';

interface Props {
    calendar: VisualCalendar | SubscribedCalendar;
    defaultCalendar?: VisualCalendar;
    onEdit?: () => void;
    isEditDisabled: boolean;
}

const CalendarSubpageHeaderSection = ({ calendar, defaultCalendar, onEdit, isEditDisabled }: Props) => {
    const { contactEmailsMap } = useContactEmailsCache();

    const { Name, Description, Color, Email } = calendar;
    const { isSubscribed, badges, isNotSyncedInfo } = getCalendarStatusBadges(calendar, defaultCalendar?.ID);
    const url = getCalendarHasSubscriptionParameters(calendar) ? calendar.SubscriptionParameters.URL : undefined;

    const ownerText = (() => {
        // we only need to display the owner for shared calendars
        if (isSubscribed || getIsOwnedCalendar(calendar)) {
            return '';
        }
        const { Name: contactName, Email: contactEmail } =
            contactEmailsMap[canonicalizeEmail(calendar.Owner.Email)] || {};
        const email = contactEmail || calendar.Owner.Email;
        const { nameEmail: ownerName } = getContactDisplayNameEmail({
            name: contactName,
            email,
            emailDelimiters: ['(', ')'],
        });

        return c('Shared calendar; Info about calendar owner').t`Created by ${ownerName}`;
    })();

    const [calendarModal, setIsCalendarModalOpen, renderCalendarModal] = useModalState();

    const handleEdit = () => {
        setIsCalendarModalOpen(true);
    };

    return (
        <SettingsSection large className="container-section-sticky-section">
            {renderCalendarModal && (
                <CalendarModal
                    calendar={calendar}
                    type={CALENDAR_MODAL_TYPE.VISUAL}
                    onEditCalendar={onEdit}
                    {...calendarModal}
                />
            )}
            <div className="mt1-5 mb1-5 flex flex-justify-space-between flex-nowrap">
                <div className="grid-align-icon">
                    <CalendarSelectIcon large color={Color} className="mr0-75 mt1 flex-item-noshrink keep-left" />
                    <h1 className="h1 mb0-25 text-bold text-break" title={Name}>
                        {Name}
                    </h1>
                    {Description && <div className="mb0-25 text-break">{Description}</div>}
                    {ownerText && (
                        <div className="text-break mt0-25" title={ownerText}>
                            {ownerText}
                        </div>
                    )}
                    <div className="text-ellipsis color-weak" title={Email}>
                        {Email}
                    </div>
                    {isSubscribed && (
                        <div
                            className={classnames(['text-break text-sm mt0-25 color-weak', !url && 'calendar-email'])}
                            title={url || ''}
                        >
                            {url}
                        </div>
                    )}
                    <div className="mt0-25">
                        {badges
                            .filter(({ statusType }) => statusType !== CALENDAR_STATUS_TYPE.ACTIVE)
                            .map(({ statusType, badgeType, text, tooltipText }) => (
                                <CalendarBadge
                                    key={statusType}
                                    badgeType={badgeType}
                                    text={text}
                                    tooltipText={isNotSyncedInfo ? undefined : tooltipText}
                                />
                            ))}
                    </div>
                    {isNotSyncedInfo && (
                        <Alert
                            className="mt1 mb1"
                            type="warning"
                            learnMore={
                                isNotSyncedInfo.isSyncing
                                    ? undefined
                                    : getKnowledgeBaseUrl('/subscribe-to-external-calendar#troubleshooting')
                            }
                        >
                            {isNotSyncedInfo.longText}
                        </Alert>
                    )}
                </div>
                <span className="ml1 pt0-5 flex-item-noshrink">
                    <Tooltip title={c('Calendar edit button tooltip').t`Edit calendar information`}>
                        <ButtonLike shape="outline" onClick={handleEdit} icon disabled={isEditDisabled}>
                            <Icon name="pen" alt={c('Calendar edit button tooltip').t`Edit calendar information`} />
                        </ButtonLike>
                    </Tooltip>
                </span>
            </div>
        </SettingsSection>
    );
};

export default CalendarSubpageHeaderSection;
