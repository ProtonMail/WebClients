import React, { SyntheticEvent, useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { c } from 'ttag';
import { useLoading, useGetEncryptionPreferences, Icon, classnames } from 'react-components';

import { noop } from 'proton-shared/lib/helpers/function';
import getSendPreferences from '../../../helpers/message/getSendPreferences';
import { validateAddress, recipientToInput, inputToRecipient } from '../../../helpers/addresses';

import { MapSendPreferences } from '../../../helpers/message/sendPreferences';
import { getStatusIcon } from '../../../helpers/send/icon';
import { Recipient } from '../../../models/address';
import { MessageExtended } from '../../../models/message';
import EncryptionStatusIcon, { MapStatusIcon } from '../../message/EncryptionStatusIcon';

interface Props {
    recipient: Required<Pick<Recipient, 'Address'>>;
    message: MessageExtended;
    mapSendPrefs: MapSendPreferences;
    mapSendIcons: MapStatusIcon;
    setMapSendPrefs: Dispatch<SetStateAction<MapSendPreferences>>;
    setMapSendIcons: Dispatch<SetStateAction<MapStatusIcon>>;
    onChange?: (value: Recipient) => void;
    onRemove: () => void;
}

const validate = (emailAddress?: string | null): boolean => {
    if (!emailAddress) {
        return false;
    }
    const recipient = inputToRecipient(emailAddress);
    return validateAddress(recipient.Address);
};

const AddressesRecipientItem = ({
    recipient,
    message,
    mapSendPrefs,
    mapSendIcons,
    setMapSendPrefs,
    setMapSendIcons,
    onChange = noop,
    onRemove,
    ...rest
}: Props) => {
    const getEncryptionPreferences = useGetEncryptionPreferences();
    const [loading, withLoading] = useLoading(true);
    const editableRef = useRef<HTMLSpanElement | null>(null);

    const [valid, setValid] = useState<boolean>(validateAddress(recipient.Address));

    const emailAddress = recipient.Address;
    const sendIcon = mapSendIcons[emailAddress];

    useEffect(() => {
        const updateRecipientIcon = async () => {
            if (!emailAddress || sendIcon) {
                return;
            }

            const encryptionPreferences = await getEncryptionPreferences(emailAddress);
            if (encryptionPreferences.failure) {
                setValid(false);
                throw encryptionPreferences.failure.error;
            }
            const sendPreferences = getSendPreferences(encryptionPreferences, message.data || {});
            setMapSendPrefs({ ...mapSendPrefs, [emailAddress]: sendPreferences });
            setMapSendIcons({ ...mapSendIcons, [emailAddress]: getStatusIcon(sendPreferences) });
        };

        // TODO: Manage recipient names
        const value = recipientToInput(recipient);

        if (editableRef.current) {
            editableRef.current.textContent = value;
        }
        withLoading(updateRecipientIcon());
    }, [emailAddress]);

    const handleChange = (event: SyntheticEvent) => {
        if (!editableRef.current) {
            return;
        }
        editableRef.current.textContent = (event.target as HTMLSpanElement).textContent || '';
    };
    const handleBlur = () => {
        if (!editableRef.current) {
            return;
        }
        setValid(validate(editableRef.current.textContent));
        onChange(inputToRecipient(editableRef.current.textContent as string));
    };
    const handleRemove = () => {
        setMapSendIcons({ ...mapSendIcons, [emailAddress]: undefined });
        onRemove();
    };

    return (
        <div
            className={classnames([
                'composer-addresses-item bordered-container mb0-5 mr0-5 flex flex-items-center flex-nowrap flex-row mw80 stop-propagation',
                !valid && 'invalid'
            ])}
            data-testid="composer-addresses-item"
            {...rest}
        >
            {valid && (sendIcon || loading) && <EncryptionStatusIcon loading={loading} {...sendIcon} />}
            <span
                className="composer-addresses-item-label mtauto mbauto pl0-5 ellipsis pr0-5"
                contentEditable={onChange !== noop}
                onKeyUp={handleChange}
                onPaste={handleChange}
                onBlur={handleBlur}
                ref={editableRef}
            />
            <button
                type="button"
                className="composer-addresses-item-remove flex-item-noshrink inline-flex pl0-5 pr0-5 no-pointer-events-children h100"
                onClick={handleRemove}
                title={c('Action').t`Remove`}
            >
                <Icon name="off" size={12} className="mauto" />
                <span className="sr-only">{c('Action').t`Remove`}</span>
            </button>
        </div>
    );
};

export default AddressesRecipientItem;
