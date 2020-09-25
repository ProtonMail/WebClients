import React, { memo, Fragment, MouseEvent } from 'react';
import { c } from 'ttag';
import { Label, LinkButton, classnames } from 'react-components';
import { Recipient } from 'proton-shared/lib/interfaces/Address';
import { ContactEmail, ContactGroup } from 'proton-shared/lib/interfaces/contacts';

import { MapSendInfo, STATUS_ICONS_FILLS } from '../../../models/crypto';
import { Message } from '../../../models/message';
import { recipientTypes } from '../../../models/address';
import { getRecipients } from '../../../helpers/message/messages';
import { recipientsToRecipientOrGroup, getRecipientOrGroupLabel } from '../../../helpers/addresses';
import EncryptionStatusIcon from '../../message/EncryptionStatusIcon';

interface Props {
    message: Message | undefined;
    mapSendInfo?: MapSendInfo;
    contacts: ContactEmail[];
    contactGroups: ContactGroup[];
    onFocus: () => void;
    toggleExpanded: (e: MouseEvent<HTMLButtonElement>) => void;
}

const AddressesSummary = ({ message, mapSendInfo, contacts, contactGroups, toggleExpanded, onFocus }: Props) => {
    const title = recipientsToRecipientOrGroup(getRecipients(message), contactGroups)
        .map((recipientOrGroup) => getRecipientOrGroupLabel(recipientOrGroup, contacts))
        .join(', ');
    return (
        <div className="flex flex-row flex-nowrap flex-items-center m0-5 pl0-5 pr0-5" onClick={onFocus}>
            <Label className="composer-meta-label pr0-5 pt0 bold">{c('Title').t`To`}</Label>
            <div className="pm-field flex composer-addresses-fakefield flex-row flex-item-fluid w100 relative">
                <span className="ellipsis composer-addresses-fakefield-inner" title={title}>
                    {getRecipients(message).length === 0 ? (
                        <span className="placeholder">{c('Placeholder').t`Email address`}</span>
                    ) : null}
                    {recipientTypes.map((type) => {
                        const recipients: Recipient[] = message?.[type] || [];
                        if (recipients.length === 0) {
                            return null;
                        }
                        const recipientOrGroups = recipientsToRecipientOrGroup(recipients, contactGroups);
                        return (
                            <Fragment key={type}>
                                {type === 'CCList' && (
                                    <span className="mr0-5 color-primary" title={c('Title').t`Carbon Copy`}>
                                        {c('Title').t`CC`}:
                                    </span>
                                )}
                                {type === 'BCCList' && (
                                    <span
                                        className="mr0-5 inline-flex color-primary"
                                        title={c('Title').t`Blind Carbon Copy`}
                                    >
                                        {c('Title').t`BCC`}:
                                    </span>
                                )}
                                {recipientOrGroups.map((recipientOrGroup, i) => {
                                    const Address = recipientOrGroup.recipient?.Address;
                                    const sendInfo = Address ? mapSendInfo?.[Address] : undefined;
                                    const valid = sendInfo
                                        ? (sendInfo?.emailValidation && !sendInfo?.emailAddressWarnings?.length) ||
                                          false
                                        : true;
                                    const icon = sendInfo?.sendIcon;
                                    const cannotSend = !valid || icon?.fill === STATUS_ICONS_FILLS.FAIL;
                                    return (
                                        <span
                                            key={i}
                                            className={classnames([
                                                'mr0-5 aligntop',
                                                cannotSend && 'color-global-warning'
                                            ])}
                                        >
                                            <span>
                                                <span className="composer-addresses-addressIcon relative">
                                                    {icon && <EncryptionStatusIcon {...icon} />}
                                                </span>
                                                <span className="mw100 ellipsis">
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
                <LinkButton
                    className="composer-addresses-ccbcc nodecoration strong"
                    title={c('Action').t`Carbon Copy, Blind Carbon Copy`}
                    onClick={toggleExpanded}
                >
                    {c('Action').t`CC, BCC`}
                </LinkButton>
            </div>
        </div>
    );
};

export default memo(AddressesSummary);
