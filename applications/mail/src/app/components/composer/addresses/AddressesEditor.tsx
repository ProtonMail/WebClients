import React, { useState, MutableRefObject } from 'react';
import { c } from 'ttag';
import { Label, generateUID, LinkButton } from 'react-components';
import { ContactGroup } from 'proton-shared/lib/interfaces/ContactGroup';


import { MessageExtended } from '../../../models/message';
import AddressesInput from './AddressesInput';
import { ContactEmail } from '../../../models/contact';
import { RecipientType, Recipient } from '../../../models/address';

interface Props {
    message: MessageExtended;
    contacts: ContactEmail[];
    contactGroups: ContactGroup[];
    onChange: (message: Partial<MessageExtended>) => void;
    expanded: boolean;
    toggleExpanded: () => void;
    inputFocusRef: MutableRefObject<() => void>;
}

const AddressesEditor = ({
    message,
    contacts,
    contactGroups,
    onChange,
    expanded,
    toggleExpanded,
    inputFocusRef
}: Props) => {
    const [uid] = useState(generateUID('composer'));
    // const { createModal } = useModals();

    const handleChange = (type: RecipientType) => (value: Recipient[]) => {
        onChange({ data: { [type]: value } });
    };

    // const handleContactModal = (type: RecipientType) => async () => {
    //     const recipients = await new Promise((resolve) => {
    //         createModal(
    //             <AddressesContactsModal inputValue={message.data?.[type]} allContacts={contacts} onSubmit={resolve} />
    //         );
    //     });

    //     onChange({ data: { [type]: recipients } });
    // };

    return (
        <div className="flex flex-column flex-nowrap flex-items-start pl0-5 pr0-5 mb0-5">
            <div className="flex flex-row w100 mb0-5 relative">
                <Label htmlFor={`to-${uid}`} className="composer-meta-label bold">
                    {/* <Tooltip title={c('Title').t`Add contacts`}> */}
                    {/* <a onClick={handleContactModal('ToList')}>{c('Title').t`To`}</a> */}
                    {c('Label').t`To`}
                    {/* </Tooltip> */}
                </Label>
                <AddressesInput
                    id={`to-${uid}`}
                    recipients={message.data?.ToList}
                    onChange={handleChange('ToList')}
                    inputFocusRef={inputFocusRef}
                    contacts={contacts}
                    contactGroups={contactGroups}
                    placeholder={c('Placeholder').t`Email address`}
                />
                {!expanded && (
                    <LinkButton className="composer-addresses-ccbcc nodecoration strong" onClick={toggleExpanded}>
                        {c('Action').t`CC, BCC`}
                    </LinkButton>
                )}
            </div>
            {expanded && (
                <>
                    <div className="flex flex-row w100 mb0-5">
                        <Label htmlFor={`cc-${uid}`} className="composer-meta-label bold">
                            {/* <Tooltip title={c('Title').t`Add contacts`}> */}
                            {/* <a onClick={handleContactModal('CCList')}>{c('Title').t`CC`}</a> */}
                            {c('Label').t`CC`}
                            {/* </Tooltip> */}
                        </Label>
                        <AddressesInput
                            id={`cc-${uid}`}
                            recipients={message.data?.CCList}
                            onChange={handleChange('CCList')}
                            contacts={contacts}
                            contactGroups={contactGroups}
                            placeholder={c('Placeholder').t`Email address`}
                        />
                    </div>
                    <div className="flex flex-row w100">
                        <Label htmlFor={`bcc-${uid}`} className="composer-meta-label bold">
                            {/* <Tooltip title={c('Title').t`Add contacts`}> */}
                            {/* <a onClick={handleContactModal('BCCList')}>{c('Title').t`BCC`}</a> */}
                            {c('Label').t`BCC`}
                            {/* </Tooltip> */}
                        </Label>
                        <AddressesInput
                            id={`bcc-${uid}`}
                            recipients={message.data?.BCCList}
                            onChange={handleChange('BCCList')}
                            contacts={contacts}
                            contactGroups={contactGroups}
                            placeholder={c('Placeholder').t`Email address`}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default AddressesEditor;
