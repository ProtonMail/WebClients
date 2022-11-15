import { MouseEventHandler } from 'react';

import { c } from 'ttag';

import { Icon, Tooltip, classnames } from '@proton/components';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { Recipient } from '@proton/shared/lib/interfaces';

import { isProtonAddress } from './helpers';

interface Props {
    recipient: Recipient;
    onDeleteRecipient: MouseEventHandler;
    isValid: boolean;
}

const getErrorMessage = (emailAddress: string) => {
    if (isProtonAddress(emailAddress)) {
        return c('Info').t`You cannot refer ${MAIL_APP_NAME} users`;
    }
    return c('Info').t`${emailAddress} is invalid`;
};

const InviteSendEmailRecipient = ({ recipient, onDeleteRecipient, isValid }: Props) => {
    const emailAddress = recipient.Address;

    return (
        <div
            className={classnames([
                'flex flex-nowrap flex-row flex-align-items-stretch max-w100 rounded-sm bg-weak overflow-hidden',
                !isValid && 'color-danger',
            ])}
            key={recipient.Address}
        >
            <Tooltip title={!isValid ? getErrorMessage(emailAddress) : undefined}>
                <span className="flex flex-align-items-center pr0-25 pl0-5">
                    <span className="text-ellipsis">{recipient.Address}</span>
                </span>
            </Tooltip>
            <Tooltip title={c('Action').t`Remove`}>
                <button onClick={onDeleteRecipient} className="flex flex-item-noshrink px0-25 interactive">
                    <Icon name="cross-small" className="mauto" alt={c('Action').t`Remove`} />
                </button>
            </Tooltip>
        </div>
    );
};

export default InviteSendEmailRecipient;
