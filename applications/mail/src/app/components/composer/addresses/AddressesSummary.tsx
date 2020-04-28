import React, { Fragment } from 'react';
import { c } from 'ttag';
import { Label, LinkButton, classnames } from 'react-components';
import { MapSendInfo, STATUS_ICONS_FILLS } from '../../../models/crypto';

import { MessageExtended } from '../../../models/message';
import { Recipient, recipientTypes } from '../../../models/address';
import { getRecipients } from '../../../helpers/message/messages';
import { recipientsToRecipientOrGroup, getRecipientOrGroupLabel, validateAddress } from '../../../helpers/addresses';
import { ContactEmail, ContactGroup } from 'proton-shared/lib/interfaces/contacts';
import EncryptionStatusIcon from '../../message/EncryptionStatusIcon';

interface Props {
    message: MessageExtended;
    mapSendInfo: MapSendInfo;
    contacts: ContactEmail[];
    contactGroups: ContactGroup[];
    onFocus: () => void;
}

const AddressesSummary = ({ message: { data = {} }, mapSendInfo, contacts, contactGroups, onFocus }: Props) => {
    return (
        <div className="flex flex-row flex-nowrap flex-items-center pl0-5 pr0-5 mb0-5" onClick={onFocus}>
            <Label htmlFor={null} className="composer-meta-label pr0-5 pt0 bold">
                {c('Title').t`To`}
            </Label>
            <div className="pm-field flex composer-addresses-fakefield flex-row flex-item-fluid w100 relative">
                <span className="ellipsis composer-addresses-fakefield-inner">
                    {getRecipients(data).length === 0 ? (
                        <span className="placeholder">{c('Placeholder').t`Email address`}</span>
                    ) : null}
                    {recipientTypes.map((type) => {
                        const recipients: Recipient[] = data[type] || [];
                        if (recipients.length === 0) {
                            return null;
                        }
                        const recipientOrGroups = recipientsToRecipientOrGroup(recipients, contactGroups);
                        return (
                            <Fragment key={type}>
                                {type === 'CCList' && <span className="mr0-5 color-primary">{c('Title').t`CC`}:</span>}
                                {type === 'BCCList' && (
                                    <span className="mr0-5 inline-flex color-primary">{c('Title').t`BCC`}:</span>
                                )}
                                {recipientOrGroups.map((recipientOrGroup, i) => {
                                    const Address = recipientOrGroup.recipient?.Address as string;
                                    const valid = validateAddress(Address);
                                    const icon = mapSendInfo[Address]?.sendIcon;
                                    const cannotSend = !valid || icon?.fill === STATUS_ICONS_FILLS.FAIL;
                                    return (
                                        <span
                                            key={i}
                                            className={classnames([
                                                'inline-flex mr0-5 aligntop',
                                                cannotSend && 'color-global-warning'
                                            ])}
                                        >
                                            <span className="inline-flex">
                                                {icon && <EncryptionStatusIcon {...icon} />}
                                                <span className="inline-flex">
                                                    {getRecipientOrGroupLabel(recipientOrGroup, contacts)}
                                                </span>
                                            </span>
                                            {i !== recipientOrGroups.length - 1 && ','}
                                        </span>
                                    );
                                })}
                            </Fragment>
                        );
                    })}
                </span>
                <LinkButton className="composer-addresses-ccbcc nodecoration strong">
                    {c('Action').t`CC, BCC`}
                </LinkButton>
            </div>
        </div>
    );
};

export default AddressesSummary;
