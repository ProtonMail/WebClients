import React, { useState, MutableRefObject, MouseEvent } from 'react';
import { c } from 'ttag';
import {
    Label,
    generateUID,
    LinkButton,
    classnames,
    Tooltip,
    ContactListModal,
    useModals,
    InlineLinkButton
} from 'react-components';

import { ContactEmail, ContactGroup } from 'proton-shared/lib/interfaces/contacts';
import { Recipient } from 'proton-shared/lib/interfaces/Address';

import { MessageExtended } from '../../../models/message';
import { RecipientType } from '../../../models/address';
import { MessageChange } from '../Composer';
import { MessageSendInfo } from '../../../hooks/useSendInfo';
import AddressesInput from './AddressesInput';

interface Props {
    message: MessageExtended;
    contacts: ContactEmail[];
    contactGroups: ContactGroup[];
    messageSendInfo: MessageSendInfo;
    onChange: MessageChange;
    expanded: boolean;
    toggleExpanded: (e: MouseEvent<HTMLButtonElement>) => void;
    inputFocusRef: MutableRefObject<() => void>;
}

const AddressesEditor = ({
    message,
    contacts,
    contactGroups,
    messageSendInfo,
    onChange,
    expanded,
    toggleExpanded,
    inputFocusRef
}: Props) => {
    const [uid] = useState(generateUID('composer'));
    const { createModal } = useModals();

    const handleChange = (type: RecipientType) => (value: Partial<Recipient>[]) => {
        onChange({ data: { [type]: value } });
    };

    const handleContactModal = (type: RecipientType) => async () => {
        const recipients: Recipient[] = await new Promise((resolve, reject) => {
            createModal(<ContactListModal onSubmit={resolve} onClose={reject} inputValue={message.data?.[type]} />);
        });

        const currentRecipients = message.data && message.data[type] ? message.data[type] : [];
        // the contacts being handled in the modal
        const currentNonContacts = currentRecipients.filter((r) => !r.ContactID);

        onChange({ data: { [type]: [...currentNonContacts, ...recipients] } });
    };

    return (
        <div className="flex flex-column flex-nowrap flex-items-start m0-5 pl0-5 pr0-5">
            <div className={classnames(['flex flex-row w100 relative', expanded && 'mb0-5'])}>
                <Label htmlFor={`to-${uid}`} className="composer-meta-label bold">
                    <Tooltip title={c('Title').t`Add contacts`}>
                        <InlineLinkButton onClick={handleContactModal('ToList')}>{c('Title').t`To`}</InlineLinkButton>
                    </Tooltip>
                </Label>
                <AddressesInput
                    id={`to-${uid}`}
                    recipients={message.data?.ToList}
                    messageSendInfo={messageSendInfo}
                    contacts={contacts}
                    contactGroups={contactGroups}
                    onChange={handleChange('ToList')}
                    inputFocusRef={inputFocusRef}
                    placeholder={c('Placeholder').t`Email address`}
                    data-cy="to"
                />
                {!expanded && (
                    <LinkButton
                        className="composer-addresses-ccbcc nodecoration strong"
                        title={c('Action').t`Carbon Copy, Blind Carbon Copy`}
                        onClick={toggleExpanded}
                    >
                        {c('Action').t`CC, BCC`}
                    </LinkButton>
                )}
            </div>
            {expanded && (
                <>
                    <div className="flex flex-row w100 mb0-5">
                        <Label
                            htmlFor={`cc-${uid}`}
                            className="composer-meta-label bold"
                            title={c('Label').t`Carbon Copy`}
                        >
                            <Tooltip title={c('Title').t`Add contacts`}>
                                <InlineLinkButton onClick={handleContactModal('CCList')}>
                                    {c('Title').t`CC`}
                                </InlineLinkButton>
                            </Tooltip>
                        </Label>
                        <AddressesInput
                            id={`cc-${uid}`}
                            recipients={message.data?.CCList}
                            messageSendInfo={messageSendInfo}
                            onChange={handleChange('CCList')}
                            contacts={contacts}
                            contactGroups={contactGroups}
                            placeholder={c('Placeholder').t`Email address`}
                            data-cy="cc"
                        />
                    </div>
                    <div className="flex flex-row w100">
                        <Label
                            htmlFor={`bcc-${uid}`}
                            className="composer-meta-label bold"
                            title={c('Label').t`Blind Carbon Copy`}
                        >
                            <Tooltip title={c('Title').t`Add contacts`}>
                                <InlineLinkButton onClick={handleContactModal('BCCList')}>
                                    {c('Title').t`BCC`}
                                </InlineLinkButton>
                            </Tooltip>
                        </Label>
                        <AddressesInput
                            id={`bcc-${uid}`}
                            recipients={message.data?.BCCList}
                            messageSendInfo={messageSendInfo}
                            onChange={handleChange('BCCList')}
                            contacts={contacts}
                            contactGroups={contactGroups}
                            placeholder={c('Placeholder').t`Email address`}
                            data-cy="bcc"
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default AddressesEditor;
