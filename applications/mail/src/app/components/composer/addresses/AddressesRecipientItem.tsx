import React, { SyntheticEvent, useState, useEffect, useRef } from 'react';
import { Icon, classnames } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';

import { validateAddress, recipientToInput, inputToRecipient } from '../../../helpers/addresses';
import { Recipient } from '../../../models/address';

interface Props {
    recipient: Recipient;
    onChange?: (value: Recipient) => void;
    onRemove: () => void;
}

const AddressesRecipientItem = ({ recipient, onChange = noop, onRemove }: Props) => {
    const [model, setModel] = useState(recipientToInput(recipient));
    const editableRef = useRef<HTMLSpanElement>(null);

    const validate = () => {
        // TODO: Check server
        const recipient = inputToRecipient(model);
        return validateAddress(recipient.Address);
    };

    const [valid, setValid] = useState(validate());

    useEffect(() => {
        // TODO: Manage recipient names
        const value = recipientToInput(recipient);

        if (editableRef.current) {
            editableRef.current.textContent = value;
        }
        setModel(value);
    }, [recipient]);

    const handleChange = (event: SyntheticEvent) => {
        setModel((event.target as HTMLSpanElement).textContent || '');
    };
    const handleBlur = () => {
        setValid(validate());
        onChange(inputToRecipient(model));
    };

    return (
        <div
            className={classnames([
                'composer-addresses-item bordered-container flex flex-items-center flex-nowrap flex-row mw80 stop-propagation',
                !valid && 'invalid'
            ])}
        >
            {/* TODO: Icon lock */}
            <span
                className="composer-addresses-item-label mtauto mbauto pl0-5 ellipsis pr0-5"
                contentEditable={onChange !== noop}
                onKeyUp={handleChange}
                onPaste={handleChange}
                onBlur={handleBlur}
                ref={editableRef}
            />
            <button
                className="composer-addresses-item-remove inline-flex pl0-5 pr0-5 no-pointer-events-children h100"
                onClick={onRemove}
            >
                <Icon name="off" size={12} className="mauto" />
            </button>
        </div>
    );
};

export default AddressesRecipientItem;
