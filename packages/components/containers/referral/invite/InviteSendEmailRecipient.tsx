import { MouseEventHandler } from 'react';

import { c } from 'ttag';

import { Icon, Tooltip } from '@proton/components';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { Recipient } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

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
            className={clsx([
                'flex flex-nowrap flex-row items-stretch max-w-full rounded-sm bg-weak overflow-hidden',
                !isValid && 'color-danger',
            ])}
            key={recipient.Address}
        >
            <Tooltip title={!isValid ? getErrorMessage(emailAddress) : undefined}>
                <span className="flex items-center px-2">
                    <span className="text-ellipsis">{recipient.Address}</span>
                </span>
            </Tooltip>
            <Tooltip title={c('Action').t`Remove`}>
                <button onClick={onDeleteRecipient} className="flex flex-item-noshrink px-1 interactive">
                    <Icon name="cross-small" className="m-auto" alt={c('Action').t`Remove`} />
                </button>
            </Tooltip>
        </div>
    );
};

export default InviteSendEmailRecipient;
