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
    onDelete: (attendee: AttendeeModel) => void;
    onHighlight: (attendeeEmail: string, highlighted: boolean) => void;
    onToggleOptional: (attendee: AttendeeModel) => void;
}

const BusyParticipantRow = ({ attendee, contactEmailsMap, onDelete, onHighlight, onToggleOptional }: Props) => {
    const dispatch = useCalendarDispatch();
    const { email: attendeeEmail, role } = attendee;
    const canonicalizedEmail = canonicalizeEmail(attendeeEmail);
    const { status, hasAvailability, isVisible, color } = useCalendarSelector((state) =>
        selectAttendeeBusyData(state, canonicalizedEmail)
    );
    const isOptional = role === ICAL_ATTENDEE_ROLE.OPTIONAL;
    const { Name: contactName, Email: contactEmail } = contactEmailsMap[canonicalizedEmail] || {};
    const email = contactEmail || attendeeEmail;

    const { nameEmail, displayOnlyEmail } = getContactDisplayNameEmail({ name: contactName, email });

    const handleVisibilityToggle = () => {
        if (status === 'loading' || status === 'not-available') {
            return;
        }
        dispatch(
            busyTimeSlotsActions.setAttendeeVisibility({
                email: attendeeEmail,
                visible: !isVisible,
            })
        );
    };

    const visibilityText = (() => {
        if (status === 'not-available') {
            return c('Description').t`Availability unknown`;
        }
        if (status === 'loading') {
            return c('Description').t`Loading availability`;
        }
        return isVisible ? c('Action').t`Hide busy times` : c('Action').t`Show busy times`;
    })();

    const dotDisplay = (() => {
        if (status === 'loading') {
            return 'loader';
        }
        if (!hasAvailability) {
            return 'half-circle';
        }
        return isVisible ? 'circle' : 'bordered-circle';
    })();

    const dotClassName = (() => {
        if (status !== 'loading' && status !== 'not-available') {
            return 'cursor-pointer';
        }
        return '';
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
            <div
                data-testid="busy-participant-dot"
                className="shrink-0 flex mt-0.5 pt-2 w-custom"
                style={{ width: '1rem' }}
            >
                <BusyParticipantRowDot
                    display={dotDisplay}
                    color={color}
                    tooltipText={visibilityText}
                    onClick={handleVisibilityToggle}
                    classname={dotClassName}
                />
            </div>

            <div className={clsx('flex flex-1 p-1')} title={nameEmail} data-testid="busy-participant">
                <div className={clsx(['text-ellipsis', displayOnlyEmail && 'max-w-full'])}>
                    {contactName ? (
                        <>
                            <span className="text-semibold text-sm" data-testid="busy-participant:contact-name">
                                {contactName}
                            </span>
                            <span className="color-weak ml-1 text-sm" data-testid="busy-participant:contact-email">
                                {email}
                            </span>
                        </>
                    ) : (
                        <span className="text-semibold text-sm" data-testid="busy-participant:email">
                            {email}
                        </span>
                    )}
                </div>
                {isOptional && <span className="color-weak w-full text-sm">{c('Label').t`Optional`}</span>}
            </div>

            <Tooltip title={visibilityText}>
                <div className={clsx(status === 'not-available' && 'hidden')}>
                    <Button
                        icon
                        shape="ghost"
                        type="button"
                        size="small"
                        className="flex shrink-0 group-hover:opacity-100 group-hover:opacity-100-no-width"
                        onClick={handleVisibilityToggle}
                    >
                        <Icon name={isVisible ? 'eye' : 'eye-slash'} alt={visibilityText} />
                    </Button>
                </div>
            </Tooltip>
            <Tooltip
                title={
                    isOptional
                        ? c('Action').t`Make this participant required`
                        : c('Action').t`Make this participant optional`
                }
            >
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
