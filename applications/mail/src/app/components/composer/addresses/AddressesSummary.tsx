import React, { Fragment } from 'react';
import { c } from 'ttag';
import { Label, LinkButton } from 'react-components';
import { ContactGroup } from 'proton-shared/lib/interfaces/ContactGroup';

import { MessageExtended } from '../../../models/message';
import { Recipient, recipientTypes } from '../../../models/address';
import { recipientsToRecipientOrGroup, getRecipientOrGroupLabel } from '../../../helpers/addresses';
import { ContactEmail } from '../../../models/contact';

interface Props {
    message: MessageExtended;
    contacts: ContactEmail[];
    contactGroups: ContactGroup[];
    onFocus: () => void;
}

const AddressesSummary = ({ message: { data = {} }, contacts, contactGroups, onFocus }: Props) => {
    return (
        <div className="flex flex-row flex-nowrap flex-items-center pl0-5 pr0-5 mb0-5" onClick={onFocus}>
            <Label htmlFor={null} className="composer-meta-label pr0-5 pt0 bold">
                {c('Title').t`To`}
            </Label>
            <div className="bordered-container flex composer-addresses-fakefield flex-row flex-item-fluid w100 relative">
                <span className="ellipsis mw100 composer-addresses-fakefield-inner">
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
                                    <span className="mr0-5 color-primary">{c('Title').t`BCC`}:</span>
                                )}
                                {recipientOrGroups.map((recipientOrGroup, i) => (
                                    <span key={i} className="mr0-5">
                                        {getRecipientOrGroupLabel(recipientOrGroup, contacts)}
                                        {i !== recipientOrGroups.length - 1 && ','}
                                    </span>
                                ))}
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
