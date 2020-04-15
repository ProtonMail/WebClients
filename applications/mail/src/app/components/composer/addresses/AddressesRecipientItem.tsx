import React, { SyntheticEvent, useState, useEffect, useRef } from 'react';
import { classnames, Icon, useGetEncryptionPreferences, useLoading, useModals } from 'react-components';
import { c } from 'ttag';

import { OpenPGPKey } from 'pmcrypto';
import { omit } from 'proton-shared/lib/helpers/object';
import { noop } from 'proton-shared/lib/helpers/function';
import getSendPreferences from '../../../helpers/message/getSendPreferences';
import { validateAddress, recipientToInput, inputToRecipient } from '../../../helpers/addresses';
import { getStatusIcon } from '../../../helpers/send/icon';

import { Recipient } from '../../../models/address';
import { StatusIconFills } from '../../../models/crypto';
import { MessageSendInfo } from './AddressesInput';
import EncryptionStatusIcon from '../../message/EncryptionStatusIcon';
import { EncryptionPreferencesFailureTypes } from 'proton-shared/lib/mail/encryptionPreferences';
import AskForKeyPinningModal from './AskForKeyPinningModal';

const { INTERNAL_USER_PRIMARY_NOT_PINNED, WKD_USER_PRIMARY_NOT_PINNED } = EncryptionPreferencesFailureTypes;
const primaryKeyNotPinnedFailureTypes = [INTERNAL_USER_PRIMARY_NOT_PINNED, WKD_USER_PRIMARY_NOT_PINNED] as any[];

interface Props {
    recipient: Required<Pick<Recipient, 'Address' | 'ContactID'>>;
    messageSendInfo?: MessageSendInfo;
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

const AddressesRecipientItem = ({ recipient, messageSendInfo, onChange = noop, onRemove, ...rest }: Props) => {
    const emailAddress = recipient.Address;
    const icon = messageSendInfo?.mapSendInfo[emailAddress]?.sendIcon;
    const cannotSend = icon?.fill === StatusIconFills.FAIL;

    const getEncryptionPreferences = useGetEncryptionPreferences();
    const { createModal } = useModals();
    const [loading, withLoading] = useLoading(!icon);
    const editableRef = useRef<HTMLSpanElement | null>(null);
    const [valid, setValid] = useState<boolean>(validateAddress(recipient.Address));

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
        if (messageSendInfo) {
            const { setMapSendInfo } = messageSendInfo;
            setMapSendInfo((mapSendInfo) => omit(mapSendInfo, [emailAddress]));
        }
        onRemove();
    };

    useEffect(() => {
        const updateRecipientIcon = async (): Promise<void> => {
            if (!emailAddress || icon || !messageSendInfo || !!messageSendInfo.mapSendInfo[emailAddress]) {
                return;
            }
            const { message, setMapSendInfo } = messageSendInfo;
            const encryptionPreferences = await getEncryptionPreferences(emailAddress);
            const sendPreferences = getSendPreferences(encryptionPreferences, message.data || {});
            if (primaryKeyNotPinnedFailureTypes.includes(sendPreferences.failure?.type)) {
                await new Promise((resolve, reject) => {
                    const contacts = [
                        {
                            contactID: recipient.ContactID,
                            emailAddress,
                            bePinnedPublicKey: encryptionPreferences.publicKey as OpenPGPKey
                        }
                    ];
                    createModal(
                        <AskForKeyPinningModal
                            contacts={contacts}
                            onSubmit={resolve}
                            onClose={reject}
                            onNotTrust={handleRemove}
                            onError={handleRemove}
                        />
                    );
                });
                return await updateRecipientIcon();
            }
            const sendIcon = getStatusIcon(sendPreferences);
            setMapSendInfo((mapSendInfo) => ({ ...mapSendInfo, [emailAddress]: { sendPreferences, sendIcon } }));
            return;
        };

        const value = recipientToInput(recipient);

        if (editableRef.current) {
            editableRef.current.textContent = value;
        }
        withLoading(updateRecipientIcon());
    }, [emailAddress]);

    return (
        <div
            className={classnames([
                'composer-addresses-item bordered-container mb0-5 mr0-5 flex flex-nowrap flex-row mw80 stop-propagation',
                !valid && 'invalid',
                cannotSend && 'color-global-warning'
            ])}
            data-testid="composer-addresses-item"
            {...rest}
        >
            {(icon || loading) && (
                <span className="border-right flex pl0-25 pr0-25 flex-item-noshrink">
                    <EncryptionStatusIcon loading={loading} {...icon} />
                </span>
            )}
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
