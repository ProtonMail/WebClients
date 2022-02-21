import { c } from 'ttag';
import { MouseEventHandler } from 'react';
import { Icon, classnames, Tooltip } from '@proton/components';
import { Recipient } from '@proton/shared/lib/interfaces';

interface Props {
    recipient: Recipient;
    onDeleteRecipient: MouseEventHandler;
    isValid: boolean;
}

const InviteSendEmailRecipient = ({ recipient, onDeleteRecipient, isValid }: Props) => (
    <Tooltip title={!isValid ? c('Info').t`This address is invalid or this is a protonmail address` : undefined}>
        <div
            className={classnames([isValid ? 'bg-weak' : 'bg-danger text-white opacity-65', ' m0-25 p0-25'])}
            key={recipient.Address}
        >
            <span className="text-no-wrap pr0-5">{recipient.Address}</span>
            <span className="cursor-pointer" onClick={onDeleteRecipient}>
                <Icon name="xmark" />
            </span>
        </div>
    </Tooltip>
);

export default InviteSendEmailRecipient;
