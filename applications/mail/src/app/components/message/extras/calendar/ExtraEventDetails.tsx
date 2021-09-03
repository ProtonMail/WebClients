import { restrictedCalendarSanitize } from '@proton/shared/lib/calendar/sanitize';
import urlify from '@proton/shared/lib/calendar/urlify';
import { c } from 'ttag';
import { useMemo } from 'react';
import * as React from 'react';
import { RequireSome } from '@proton/shared/lib/interfaces/utils';
import { classnames, Icon } from '@proton/components';
import { ICAL_METHOD } from '@proton/shared/lib/calendar/constants';
import { getFrequencyString } from '@proton/shared/lib/calendar/integration/getFrequencyString';
import { dateLocale } from '@proton/shared/lib/i18n';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';
import { getParticipantsList, InvitationModel } from '../../../../helpers/calendar/invite';
import ExtraEventParticipants from './ExtraEventParticipants';

const { REFRESH, REPLY } = ICAL_METHOD;

interface Props {
    model: RequireSome<InvitationModel, 'invitationIcs'>;
    weekStartsOn: WeekStartsOn;
}
const ExtraEventDetails = ({ model, weekStartsOn }: Props) => {
    const {
        isImport,
        hasMultipleVevents,
        calendarData,
        invitationIcs,
        invitationIcs: { method },
        invitationApi,
    } = model;
    const displayApiDetails = [REFRESH, REPLY].includes(method);
    const { vevent, organizer, participants } = invitationApi && displayApiDetails ? invitationApi : invitationIcs;
    const { rrule, dtstart } = vevent;

    const trimmedLocation = vevent.location?.value?.trim();
    const sanitizedAndUrlifiedLocation = useMemo(
        () => restrictedCalendarSanitize(urlify(trimmedLocation || '')),
        [trimmedLocation]
    );
    const frequencyString = rrule
        ? getFrequencyString(rrule.value, dtstart, {
              weekStartsOn,
              locale: dateLocale,
          })
        : undefined;
    const calendar = calendarData?.calendar?.Name;
    const participantsList = getParticipantsList(participants, organizer);

    const iconClassName = 'flex-item-noshrink mr1 mb0-25';
    const properties: { icon: string; label: string; value: string | React.ReactNode; key: string; title?: string }[] =
        [
            !!frequencyString && {
                icon: 'arrows-rotate',
                label: c('ICS widget label for event details').t`Repeats`,
                value: frequencyString,
                key: 'frequency',
                title: frequencyString,
            },
            !!calendar && {
                icon: 'calendar-days',
                label: c('ICS widget label for event details').t`Calendar`,
                value: calendar,
                key: 'calendar',
                title: calendar,
            },
            !!trimmedLocation && {
                icon: 'map-marker',
                label: c('ICS widget label for event details').t`Location`,
                value: sanitizedAndUrlifiedLocation,
                key: 'location',
            },
            {
                icon: 'user-group',
                label: c('ICS widget label for event details').t`Participants`,
                value: <ExtraEventParticipants list={participantsList} />,
                key: 'participants',
            },
        ].filter(isTruthy);

    if (isImport && hasMultipleVevents) {
        return null;
    }

    return (
        <>
            {properties.map(({ value, icon, label, key, title }, index) => {
                return (
                    <div key={key} className={classnames(['flex', index < properties.length - 1 && 'mb0-5'])}>
                        <span className="on-mobile-mr0" title={label}>
                            <Icon name={icon} className={iconClassName} />
                        </span>
                        {key === 'location' ? (
                            <div
                                className="flex-item-fluid text-break"
                                dangerouslySetInnerHTML={{ __html: sanitizedAndUrlifiedLocation }}
                            />
                        ) : (
                            <div
                                className={classnames(['flex-item-fluid', key !== 'participants' && 'text-ellipsis'])}
                                title={title}
                            >
                                {value}
                            </div>
                        )}
                    </div>
                );
            })}
        </>
    );
};

export default ExtraEventDetails;
