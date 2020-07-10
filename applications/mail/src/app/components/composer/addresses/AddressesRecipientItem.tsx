import React, { useEffect, useRef } from 'react';
import { classnames, Icon, Tooltip } from 'react-components';
import { c } from 'ttag';
import { noop } from 'proton-shared/lib/helpers/function';
import { Recipient } from 'proton-shared/lib/interfaces/Address';

import { recipientToInput, inputToRecipient } from '../../../helpers/addresses';
import { STATUS_ICONS_FILLS } from '../../../models/crypto';
import EncryptionStatusIcon from '../../message/EncryptionStatusIcon';
import { useUpdateRecipientSendInfo, MessageSendInfo } from '../../../hooks/useSendInfo';

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
    const loading = sendInfo?.loading;
    const cannotSend = icon?.fill === STATUS_ICONS_FILLS.FAIL;

    const editableRef = useRef<HTMLSpanElement | null>(null);

    const { handleRemove } = useUpdateRecipientSendInfo(messageSendInfo, recipient, onRemove);

    // Hide invalid when no send info or while loading
    const valid = !sendInfo || loading || (sendInfo?.emailValidation && !sendInfo?.emailAddressWarnings?.length);

    const handleBlur = () => {
        if (!editableRef.current) {
            return;
        }
        onChange(inputToRecipient(editableRef.current.textContent as string));
    };

    useEffect(() => {
        const value = recipientToInput(recipient);

        if (editableRef.current) {
            editableRef.current.textContent = value;
        }
    }, []);

    return (
        <div
            className={classnames([
                'composer-addresses-item bordered-container mt0-25 mb0-25 mr0-5 flex flex-nowrap flex-row mw100 stop-propagation',
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
            <Tooltip className="flex" title={sendInfo?.emailAddressWarnings?.join(', ')}>
                <span
                    className="composer-addresses-item-label mtauto mbauto pl0-5 ellipsis pr0-5"
                    contentEditable={onChange !== noop}
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
