import type { MouseEventHandler } from 'react';

import { c } from 'ttag';

import Icon from '@proton/components/components/icon/Icon';
import Tooltip from '@proton/components/components/tooltip/Tooltip';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import type { Recipient } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { isProtonAddress } from './helpers';

interface Props {
    protonDomains: Set<string>;
    recipient: Recipient;
    onDeleteRecipient: MouseEventHandler;
    isValid: boolean;
}

const getErrorMessage = (protonDomains: Set<string>, emailAddress: string) => {
    if (isProtonAddress(protonDomains, emailAddress)) {
        return c('Info').t`You cannot refer ${MAIL_APP_NAME} users`;
    }
    return c('Info').t`${emailAddress} is invalid`;
};

const InviteSendEmailRecipient = ({ protonDomains, recipient, onDeleteRecipient, isValid }: Props) => {
    const emailAddress = recipient.Address;

    return (
        <div
            className={clsx([
                'flex flex-nowrap flex-row items-stretch max-w-full rounded-sm bg-weak overflow-hidden',
                !isValid && 'color-danger',
            ])}
            key={recipient.Address}
        >
            <Tooltip title={!isValid ? getErrorMessage(protonDomains, emailAddress) : undefined}>
                <span className="flex items-center px-2">
                    <span className="text-ellipsis">{recipient.Address}</span>
                </span>
            </Tooltip>
            <Tooltip title={c('Action').t`Remove`}>
                <button onClick={onDeleteRecipient} className="flex shrink-0 px-1 interactive">
                    <Icon name="cross-small" className="m-auto" alt={c('Action').t`Remove`} />
                </button>
            </Tooltip>
        </div>
    );
};

export default InviteSendEmailRecipient;
