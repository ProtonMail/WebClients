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
    const { nameEmail, displayOnlyEmail } = getContactDisplayNameEmail({ name: contactName, email });

    const optionalText = isOptional
        ? c('Action').t`Make this participant required`
        : c('Action').t`Make this participant optional`;

    return (
        <div key={email} className="address-item flex items-start mb-1 group-hover-opacity-container">
            <div className="flex flex-1 py-1 pr-1" title={nameEmail} data-testid="participant-row">
                <div className={clsx(['text-ellipsis', displayOnlyEmail && 'max-w-full'])}>
                    {contactName ? (
                        <>
                            <span className="text-semibold text-sm" data-testid="participant-row:contact-name">
                                {contactName}
                            </span>
                            <span className="color-weak ml-1 text-sm" data-testid="participant-row:contact-email">
                                {email}
                            </span>
                        </>
                    ) : (
                        <span className="text-semibold text-sm" data-testid="participant-row:email">
                            {email}
                        </span>
                    )}
                </div>
                {isOptional ? <span className="color-weak text-sm w-full">{c('Label').t`Optional`}</span> : null}
            </div>
            <Tooltip title={optionalText}>
                <Button
                    icon
                    shape="ghost"
                    type="button"
                    size="small"
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
                    onClick={() => onDelete(attendee)}
                >
                    <Icon name="cross" alt={c('Action').t`Remove this participant`} />
                </Button>
            </Tooltip>
        </div>
    );
};

export default ParticipantRow;
