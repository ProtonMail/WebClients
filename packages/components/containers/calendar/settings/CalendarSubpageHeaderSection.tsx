import { c } from 'ttag';

import { ButtonLike, Href } from '@proton/atoms';
import { useModalState } from '@proton/components/components';
import Alert from '@proton/components/components/alert/Alert';
import CalendarSelectIcon from '@proton/components/components/calendarSelect/CalendarSelectIcon';
import Icon from '@proton/components/components/icon/Icon';
import Tooltip from '@proton/components/components/tooltip/Tooltip';
import { SettingsSectionWide } from '@proton/components/containers';
import { useContactEmailsCache } from '@proton/components/containers/contacts/ContactEmailsProvider';
import { CALENDAR_STATUS_TYPE, getCalendarStatusBadges } from '@proton/shared/lib/calendar/badges';
import { getIsHolidaysCalendar } from '@proton/shared/lib/calendar/calendar';
import {
    getCalendarNameSubline,
    getSharedCalendarSubHeaderText,
} from '@proton/shared/lib/calendar/sharing/shareProton/shareProton';
import { getCalendarHasSubscriptionParameters } from '@proton/shared/lib/calendar/subscribe/helpers';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { SubscribedCalendar, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import clsx from '@proton/utils/clsx';

import HolidaysCalendarModal from '../calendarModal/holidaysCalendarModal/HolidaysCalendarModal';
import { CALENDAR_MODAL_TYPE } from '../calendarModal/interface';
import { PersonalCalendarModal } from '../calendarModal/personalCalendarModal/PersonalCalendarModal';
import CalendarBadge from './CalendarBadge';

interface Props {
    calendar: VisualCalendar | SubscribedCalendar;
    defaultCalendar?: VisualCalendar;
    holidaysCalendars: VisualCalendar[];
    onEdit?: () => void;
    canEdit: boolean;
}

const CalendarSubpageHeaderSection = ({ calendar, defaultCalendar, holidaysCalendars, onEdit, canEdit }: Props) => {
    const { contactEmailsMap } = useContactEmailsCache();

    const {
        Name,
        Description,
        Color,
        Email: memberEmail,
        Type: calendarType,
        Permissions: memberPermissions,
    } = calendar;
    const { isSubscribed, badges, isNotSyncedInfo } = getCalendarStatusBadges(calendar, defaultCalendar?.ID);
    const url = getCalendarHasSubscriptionParameters(calendar) ? calendar.SubscriptionParameters.URL : undefined;
    const subHeaderText = getSharedCalendarSubHeaderText(calendar, contactEmailsMap);
    const subline = getCalendarNameSubline({ calendarType, displayEmail: true, memberEmail, memberPermissions });

    const editCalendarText = c('Calendar edit button tooltip').t`Edit calendar`;

    const [calendarModal, setIsCalendarModalOpen, renderCalendarModal] = useModalState();
    const [holidaysCalendarModal, setHolidaysCalendarModalOpen, renderHolidaysCalendarModal] = useModalState();

    const handleEdit = () => {
        if (getIsHolidaysCalendar(calendar)) {
            setHolidaysCalendarModalOpen(true);
        } else {
            setIsCalendarModalOpen(true);
        }
    };

    return (
        <SettingsSectionWide className="container-section-sticky-section">
            {renderCalendarModal && (
                <PersonalCalendarModal
                    calendar={calendar}
                    type={CALENDAR_MODAL_TYPE.VISUAL}
                    onEditCalendar={onEdit}
                    {...calendarModal}
                />
            )}
            {renderHolidaysCalendarModal && (
                <HolidaysCalendarModal
                    {...holidaysCalendarModal}
                    calendar={calendar}
                    holidaysCalendars={holidaysCalendars}
                    type={CALENDAR_MODAL_TYPE.VISUAL}
                    onEditCalendar={onEdit}
                />
            )}
            <div className="my-6 flex justify-space-between flex-nowrap">
                <div className="grid-align-icon">
                    <CalendarSelectIcon large color={Color} className="mr-3 mt-4 shrink-0 keep-left" />
                    <h1 className="h1 mb-2 text-bold text-break" title={Name}>
                        {Name}
                    </h1>
                    {Description && <div className="mb-1 text-break">{Description}</div>}

                    {subHeaderText && (
                        <div className="text-rg text-break mb-1 color-norm" title={subHeaderText}>
                            {subHeaderText}
                        </div>
                    )}
                    <div className="text-ellipsis color-weak" title={subline}>
                        {subline}
                    </div>

                    {isSubscribed && (
                        <div
                            className={clsx(['text-break text-sm mt-1 color-weak', !url && 'calendar-email'])}
                            title={url || ''}
                        >
                            {url}
                        </div>
                    )}
                    <div className="mt-1">
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
                        <Alert className="my-4" type="warning">
                            {isNotSyncedInfo.longText}
                            {isNotSyncedInfo.isSyncing ? null : (
                                <div>
                                    <Href href={getKnowledgeBaseUrl('/subscribe-to-external-calendar#troubleshooting')}>
                                        {c('Link').t`Learn more`}
                                    </Href>
                                </div>
                            )}
                        </Alert>
                    )}
                </div>
                <span className="ml-4 pt-2 shrink-0">
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
