import React, { SyntheticEvent, useEffect, useRef } from 'react';
import { classnames, Icon, useGetEncryptionPreferences, useLoading, useModals, Tooltip } from 'react-components';
import { c } from 'ttag';
import { OpenPGPKey } from 'pmcrypto';
import { omit } from 'proton-shared/lib/helpers/object';
import { noop } from 'proton-shared/lib/helpers/function';
import { EncryptionPreferencesFailureTypes } from 'proton-shared/lib/mail/encryptionPreferences';
import { validateEmailAddress } from 'proton-shared/lib/helpers/string';

import getSendPreferences from '../../../helpers/message/getSendPreferences';
import { recipientToInput, inputToRecipient } from '../../../helpers/addresses';
import { getSendStatusIcon } from '../../../helpers/message/icon';
import { Recipient } from '../../../models/address';
import { STATUS_ICONS_FILLS } from '../../../models/crypto';
import { MessageSendInfo } from './AddressesInput';
import EncryptionStatusIcon from '../../message/EncryptionStatusIcon';
import AskForKeyPinningModal from './AskForKeyPinningModal';

const { INTERNAL_USER_PRIMARY_NOT_PINNED, WKD_USER_PRIMARY_NOT_PINNED } = EncryptionPreferencesFailureTypes;
const primaryKeyNotPinnedFailureTypes = [INTERNAL_USER_PRIMARY_NOT_PINNED, WKD_USER_PRIMARY_NOT_PINNED] as any[];

interface Props {
    recipient: Required<Pick<Recipient, 'Address' | 'ContactID'>>;
    messageSendInfo?: MessageSendInfo;
    onChange?: (value: Recipient) => void;
    onRemove: () => void;
}

const AddressesRecipientItem = ({ recipient, messageSendInfo, onChange = noop, onRemove, ...rest }: Props) => {
    const emailAddress = recipient.Address;
    const sendInfo = messageSendInfo?.mapSendInfo[emailAddress];
    const icon = sendInfo?.sendIcon;
    const cannotSend = icon?.fill === STATUS_ICONS_FILLS.FAIL;

    const getEncryptionPreferences = useGetEncryptionPreferences();
    const { createModal } = useModals();
    const [loading, withLoading] = useLoading(!icon);
    const editableRef = useRef<HTMLSpanElement | null>(null);

    const valid = (sendInfo?.emailValidation && !sendInfo?.emailAddressWarnings?.length) || loading; // Loading to not show in red during validation

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
            const emailValidation = validateEmailAddress(emailAddress);
            if (!emailValidation || icon || !messageSendInfo || messageSendInfo.mapSendInfo[emailAddress]) {
                return;
            }
            const { message, setMapSendInfo } = messageSendInfo;
            const encryptionPreferences = await getEncryptionPreferences(emailAddress);
            const sendPreferences = getSendPreferences(encryptionPreferences, message.data);
            if (primaryKeyNotPinnedFailureTypes.includes(sendPreferences.failure?.type)) {
                await new Promise((resolve, reject) => {
                    const contacts = [
                        {
                            contactID: recipient.ContactID,
                            emailAddress,
                            isInternal: encryptionPreferences.isInternal,
                            bePinnedPublicKey: encryptionPreferences.sendKey as OpenPGPKey
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
            const sendIcon = getSendStatusIcon(sendPreferences);

            setMapSendInfo((mapSendInfo) => ({
                ...mapSendInfo,
                [emailAddress]: {
                    sendPreferences,
                    sendIcon,
                    emailValidation,
                    emailAddressWarnings: encryptionPreferences.emailAddressWarnings || []
                }
            }));
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
                'composer-addresses-item bordered-container mt0-25 mb0-25 mr0-5 flex flex-nowrap flex-row mw80 stop-propagation',
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
            <Tooltip title={sendInfo?.emailAddressWarnings?.join(', ')}>
                <span
                    className="composer-addresses-item-label mtauto mbauto pl0-5 ellipsis pr0-5"
                    contentEditable={onChange !== noop}
                    onKeyUp={handleChange}
                    onPaste={handleChange}
                    onBlur={handleBlur}
                    ref={editableRef}
                />
            </Tooltip>
            <button
                type="button"
                className="composer-addresses-item-remove pm-button flex flex-item-noshrink"
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
