import React, { Fragment } from 'react';
import { c } from 'ttag';
import { Label, Button } from 'react-components';

import { MessageExtended } from '../../../models/message';
import { Recipient, recipientTypes } from '../../../models/address';
import { recipientsToRecipientOrGroup, getRecipientOrGroupLabel } from '../../../helpers/addresses';
import { ContactEmail, ContactGroup } from '../../../models/contact';

interface Props {
    message: MessageExtended;
    contacts: ContactEmail[];
    contactGroups: ContactGroup[];
    onFocus: () => void;
}

const AddressesSummary = ({ message: { data = {} }, contacts, contactGroups, onFocus }: Props) => {
    return (
        <div className="flex flex-row flex-nowrap flex-items-center pl0-5 mb0-5" onClick={onFocus}>
            <Label htmlFor={null} className="composer-meta-label color-pm-blue">
                {c('Title').t`To`}
            </Label>
            <div className="flex flex-row flex-item-fluid w100">
                <span className="flex-item-fluid bordered-container flex composer-addresses-fakefield">
                    <span className="ellipsis mw100">
                        {recipientTypes.map((type) => {
                            const recipients: Recipient[] = data[type] || [];
                            if (recipients.length === 0) {
                                return null;
                            }
                            const recipientOrGroups = recipientsToRecipientOrGroup(recipients, contactGroups);
                            return (
                                <Fragment key={type}>
                                    {type === 'CCList' && (
                                        <span className="mr0-5 color-pm-blue">{c('Title').t`CC`}:</span>
                                    )}
                                    {type === 'BCCList' && (
                                        <span className="mr0-5 color-pm-blue">{c('Title').t`BCC`}:</span>
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
                </span>
                <Button icon="caret" className="pm-button--link ml0-5 mr0-5 " />
            </div>
        </div>
    );
};

export default AddressesSummary;
