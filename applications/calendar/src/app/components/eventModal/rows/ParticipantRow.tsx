import { c } from 'ttag';

import { Button, Icon, Tooltip, classnames } from '@proton/components';
import { ICAL_ATTENDEE_ROLE } from '@proton/shared/lib/calendar/constants';
import { canonicalizeEmail } from '@proton/shared/lib/helpers/email';
import { AttendeeModel } from '@proton/shared/lib/interfaces/calendar';
import { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import { SimpleMap } from '@proton/shared/lib/interfaces/utils';

interface Props {
    attendee: AttendeeModel;
    contactEmailsMap: SimpleMap<ContactEmail>;
    onToggleOptional: (attendee: AttendeeModel) => void;
    onDelete: (attendee: AttendeeModel) => void;
}

const ParticipantRow = ({ attendee, contactEmailsMap, onToggleOptional, onDelete }: Props) => {
    const { email: attendeeEmail, role } = attendee;
    const isOptional = role === ICAL_ATTENDEE_ROLE.OPTIONAL;
    const { Name: contactName, Email: contactEmail } = contactEmailsMap[canonicalizeEmail(attendeeEmail)] || {};
    const email = contactEmail || attendeeEmail;
    const optionalText = isOptional
        ? c('Action').t`Make this participant required`
        : c('Action').t`Make this participant optional`;
    const displayFull = contactName && contactName !== contactEmail;

    return (
        <div key={email} className={classnames(['address-item flex mb0-25 pl0-5'])}>
            <div className="flex flex-item-fluid p0-5" title={displayFull ? `${contactName} <${contactEmail}>` : email}>
                {displayFull ? (
                    <div className="text-ellipsis">{`${contactName} <${contactEmail}>`}</div>
                ) : (
                    <div className="max-w100 text-ellipsis">{email}</div>
                )}
                {isOptional ? <span className="color-weak w100">{c('Label').t`Optional`}</span> : null}
            </div>
            <Tooltip title={optionalText}>
                <Button
                    icon
                    shape="ghost"
                    type="button"
                    className="flex flex-item-noshrink"
                    onClick={() => onToggleOptional(attendee)}
                >
                    <Icon name={isOptional ? 'user' : 'user-filled'} alt={c('Action').t`Remove this participant`} />
                </Button>
            </Tooltip>
            <Tooltip title={c('Action').t`Remove this participant`}>
                <Button icon shape="ghost" className="flex flex-item-noshrink" onClick={() => onDelete(attendee)}>
                    <Icon name="trash" alt={c('Action').t`Remove this participant`} />
                </Button>
            </Tooltip>
        </div>
    );
};

export default ParticipantRow;
