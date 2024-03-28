import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, Tooltip } from '@proton/components';
import { ICAL_ATTENDEE_ROLE } from '@proton/shared/lib/calendar/constants';
import { getContactDisplayNameEmail } from '@proton/shared/lib/contacts/contactEmail';
import { canonicalizeEmail } from '@proton/shared/lib/helpers/email';
import { AttendeeModel } from '@proton/shared/lib/interfaces/calendar';
import { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import { SimpleMap } from '@proton/shared/lib/interfaces/utils';
import clsx from '@proton/utils/clsx';

import { selectAttendeeBusyData } from '../../../store/busyTimeSlots/busyTimeSlotsSelectors';
import { busyTimeSlotsActions } from '../../../store/busyTimeSlots/busyTimeSlotsSlice';
import { useCalendarDispatch, useCalendarSelector } from '../../../store/hooks';
import BusyParticipantRowDot from './BusyPartipantRowDot';

interface Props {
    attendee: AttendeeModel;
    contactEmailsMap: SimpleMap<ContactEmail>;
    displayBusySlotsActions: boolean;
    onDelete: (attendee: AttendeeModel) => void;
    onHighlight: (attendeeEmail: string, highlighted: boolean) => void;
    onToggleOptional: (attendee: AttendeeModel) => void;
}

const BusyParticipantRow = ({
    attendee,
    contactEmailsMap,
    displayBusySlotsActions,
    onDelete,
    onHighlight,
    onToggleOptional,
}: Props) => {
    const dispatch = useCalendarDispatch();
    const { email: attendeeEmail, role } = attendee;
    const canonicalizedEmail = canonicalizeEmail(attendeeEmail);
    const attendeeBusyData = useCalendarSelector((state) => selectAttendeeBusyData(state, canonicalizedEmail));
    const isOptional = role === ICAL_ATTENDEE_ROLE.OPTIONAL;
    const { Name: contactName, Email: contactEmail } = contactEmailsMap[canonicalizedEmail] || {};
    const email = contactEmail || attendeeEmail;

    const { nameEmail, displayOnlyEmail } = getContactDisplayNameEmail({ name: contactName, email });
    const nameEmailDisplay = contactName ? (
        <>
            <span className="text-semibold text-sm">{contactName}</span>
            <span className="color-weak ml-1 text-sm">{email}</span>
        </>
    ) : (
        <span className="text-semibold text-sm">{email}</span>
    );

    const optionalText = isOptional
        ? c('Action').t`Make this participant required`
        : c('Action').t`Make this participant optional`;

    const visibilityText = (() => {
        if (!attendeeBusyData.hasAvailability) {
            return c('Action').t`Availability is unknown`;
        }
        return attendeeBusyData.isVisible ? c('Action').t`Hide busy times` : c('Action').t`Show busy times`;
    })();

    return (
        <div
            key={email}
            className="flex items-start mb-1 group-hover-opacity-container"
            onMouseEnter={() => {
                onHighlight(email, true);
            }}
            onMouseLeave={() => {
                onHighlight(email, false);
            }}
        >
            {displayBusySlotsActions && (
                <div className="shrink-0 flex mt-0.5 pt-2 w-custom" style={{ width: '1rem' }}>
                    <BusyParticipantRowDot
                        color={attendeeBusyData.color}
                        hasAvailability={attendeeBusyData.hasAvailability}
                        isLoading={attendeeBusyData.isLoading}
                        tooltipText={visibilityText}
                    />
                </div>
            )}

            <div className={clsx('flex flex-1', displayBusySlotsActions ? 'p-1' : 'py-1 pr-1')} title={nameEmail}>
                <div className={clsx(['text-ellipsis', displayOnlyEmail && 'max-w-full'])}>{nameEmailDisplay}</div>
                {isOptional ? <span className="color-weak w-full text-sm">{c('Label').t`Optional`}</span> : null}
            </div>

            {displayBusySlotsActions && (
                <Tooltip title={visibilityText}>
                    <div>
                        <Button
                            icon
                            shape="ghost"
                            type="button"
                            size="small"
                            className="flex shrink-0 group-hover:opacity-100 group-hover:opacity-100-no-width"
                            disabled={!attendeeBusyData.hasAvailability}
                            onClick={() => {
                                dispatch(
                                    busyTimeSlotsActions.setAttendeeVisibility({
                                        email: attendeeEmail,
                                        visible: !attendeeBusyData.isVisible,
                                    })
                                );
                            }}
                        >
                            <Icon name={attendeeBusyData.isVisible ? 'eye' : 'eye-slash'} alt={visibilityText} />
                        </Button>
                    </div>
                </Tooltip>
            )}
            <Tooltip title={optionalText}>
                <Button
                    icon
                    shape="ghost"
                    size="small"
                    type="button"
                    className="flex shrink-0 group-hover:opacity-100 group-hover:opacity-100-no-width"
                    onClick={() => onToggleOptional(attendee)}
                >
                    <Icon name={isOptional ? 'user' : 'user-filled'} alt={c('Action').t`Remove this participant`} />
                </Button>
            </Tooltip>
            <Tooltip title={c('Action').t`Remove this participant`}>
                <Button
                    icon
                    shape="ghost"
                    size="small"
                    className="flex shrink-0 group-hover:opacity-100 group-hover:opacity-100-no-width"
                    onClick={() => {
                        dispatch(busyTimeSlotsActions.removeAttendee(attendeeEmail));
                        onDelete(attendee);
                    }}
                >
                    <Icon name="cross" alt={c('Action').t`Remove this participant`} />
                </Button>
            </Tooltip>
        </div>
    );
};

export default BusyParticipantRow;
