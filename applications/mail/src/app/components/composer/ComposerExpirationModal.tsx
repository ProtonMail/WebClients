import React, { useState, ChangeEvent } from 'react';
import { c } from 'ttag';
import { Alert, Href, generateUID, useNotifications, Label } from 'react-components';
import { range } from 'proton-shared/lib/helpers/array';

import { MessageExtended } from '../../models/message';
import ComposerInnerModal from './ComposerInnerModal';
import { MAX_EXPIRATION_TIME } from '../../constants';
import { MessageChange } from './Composer';

const initValues = ({ expiresIn = 0 }: Partial<MessageExtended> = {}) => {
    const deltaHours = expiresIn / 3600;
    const deltaDays = Math.floor(deltaHours / 24);

    return {
        days: deltaDays,
        hours: deltaHours % 24
    };
};

const computeHours = ({ days, hours }: { days: number; hours: number }) => hours + days * 24;

const optionRange = (size: number) =>
    range(0, size).map((value) => (
        <option key={value} value={value}>
            {value}
        </option>
    ));

interface Props {
    message?: MessageExtended;
    onClose: () => void;
    onChange: MessageChange;
}

const ComposerExpirationModal = ({ message, onClose, onChange }: Props) => {
    const [uid] = useState(generateUID('password-modal'));

    const values = initValues(message);

    const [days, setDays] = useState(values.days);
    const [hours, setHours] = useState(values.hours);
    const { createNotification } = useNotifications();

    const valueInHours = computeHours({ days, hours });

    const handleChange = (setter: (value: number) => void) => (event: ChangeEvent<HTMLSelectElement>) => {
        setter(Number(event.target.value));
    };

    const handleSubmit = () => {
        if (isNaN(valueInHours)) {
            createNotification({
                type: 'error',
                text: c('Error').t`Invalid expiration time.`
            });
            return;
        }

        if (valueInHours > MAX_EXPIRATION_TIME) {
            createNotification({
                type: 'error',
                text: c('Error').t`The maximum expiration is 4 weeks.`
            });
            return;
        }

        onChange({ expiresIn: valueInHours * 3600 });
        onClose();
    };

    const handleCancel = () => {
        onChange({ expiresIn: undefined });
        onClose();
    };

    const disabled = valueInHours === 0 || isNaN(valueInHours);

    return (
        <ComposerInnerModal
            title={c('Info').t`Expiration Time`}
            disabled={disabled}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
        >
            <Alert>
                {c('Info')
                    .t`If you are sending this message to a non ProtonMail user, please be sure to set a password for your message.`}
                <br />
                <Href url="https://protonmail.com/support/knowledge-base/expiration/">{c('Info').t`Learn more`}</Href>
            </Alert>
            <div className="flex flex-nowrap mt2 flex-items-center onmobile-flex-column">
                <Label>{c('Info').t`This message will expire in`}</Label>
                <span>
                    <select
                        id={`composer-expiration-days-${uid}`}
                        className="pm-field mr0-25"
                        value={days}
                        onChange={handleChange(setDays)}
                        placeholder={c('Info').t`Days`}
                    >
                        {optionRange(7 * 4)}
                    </select>
                    <label htmlFor={`composer-expiration-days-${uid}`} className="mr0-5">{c('Info').t`Days`}</label>
                    <select
                        id={`composer-expiration-hours-${uid}`}
                        className="pm-field mr0-25"
                        value={hours}
                        onChange={handleChange(setHours)}
                    >
                        {optionRange(24)}
                    </select>
                    <label htmlFor={`composer-expiration-hours-${uid}`}>{c('Info').t`Hours`}</label>
                </span>{' '}
            </div>
        </ComposerInnerModal>
    );
};

export default ComposerExpirationModal;
