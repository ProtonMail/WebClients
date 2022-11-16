import React from 'react';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import { Alert, Icon, Tooltip, useModalState } from '@proton/components/components';
import CalendarSelectIcon from '@proton/components/components/calendarSelect/CalendarSelectIcon';
import { SettingsSectionWide } from '@proton/components/containers';
import { useContactEmailsCache } from '@proton/components/containers/contacts/ContactEmailsProvider';
import { classnames } from '@proton/components/helpers';
import { CALENDAR_STATUS_TYPE, getCalendarStatusBadges } from '@proton/shared/lib/calendar/badges';
import { getCalendarCreatedByText } from '@proton/shared/lib/calendar/sharing/shareProton/shareProton';
import { getCalendarHasSubscriptionParameters } from '@proton/shared/lib/calendar/subscribe/helpers';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { SubscribedCalendar, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import { CALENDAR_MODAL_TYPE, CalendarModal } from '../calendarModal/CalendarModal';
import CalendarBadge from './CalendarBadge';

interface Props {
    calendar: VisualCalendar | SubscribedCalendar;
    defaultCalendar?: VisualCalendar;
    onEdit?: () => void;
    canEdit: boolean;
}

const CalendarSubpageHeaderSection = ({ calendar, defaultCalendar, onEdit, canEdit }: Props) => {
    const { contactEmailsMap } = useContactEmailsCache();

    const { Name, Description, Color, Email } = calendar;
    const { isSubscribed, badges, isNotSyncedInfo } = getCalendarStatusBadges(calendar, defaultCalendar?.ID);
    const url = getCalendarHasSubscriptionParameters(calendar) ? calendar.SubscriptionParameters.URL : undefined;
    const createdByText = getCalendarCreatedByText(calendar, contactEmailsMap);
    const editCalendarText = c('Calendar edit button tooltip').t`Edit calendar`;

    const [calendarModal, setIsCalendarModalOpen, renderCalendarModal] = useModalState();

    const handleEdit = () => {
        setIsCalendarModalOpen(true);
    };

    return (
        <SettingsSectionWide className="container-section-sticky-section">
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
                    {createdByText && (
                        <div className="text-break mb0-25" title={createdByText}>
                            {createdByText}
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
                    <Tooltip title={editCalendarText}>
                        <ButtonLike shape="outline" onClick={handleEdit} icon disabled={!canEdit}>
                            <Icon name="pen" alt={editCalendarText} />
                        </ButtonLike>
                    </Tooltip>
                </span>
            </div>
        </SettingsSectionWide>
    );
};

export default CalendarSubpageHeaderSection;
