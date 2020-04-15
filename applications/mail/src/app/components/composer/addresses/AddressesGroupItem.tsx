import { omit } from 'proton-shared/lib/helpers/object';
import React, { useState } from 'react';
import { c } from 'ttag';
import { Icon, useModals } from 'react-components';

import { ContactEmail } from 'proton-shared/lib/interfaces/contacts';
import AddressesGroupModal from './AddressesGroupModal';
import { getRecipientGroupLabel } from '../../../helpers/addresses';
import { RecipientGroup } from '../../../models/address';
import { getContactsOfGroup } from '../../../helpers/contacts';
import { MessageSendInfo } from './AddressesInput';

interface Props {
    recipientGroup: RecipientGroup;
    contacts: ContactEmail[];
    messageSendInfo?: MessageSendInfo;
    onChange: (value: RecipientGroup) => void;
    onRemove: () => void;
}

const AddressesGroupItem = ({ recipientGroup, contacts, messageSendInfo, onChange, onRemove }: Props) => {
    const { createModal, getModal, hideModal, removeModal } = useModals();
    const [modalID, setModalID] = useState<any>();

    const contactsInGroup = getContactsOfGroup(contacts, recipientGroup?.group?.ID);
    const emailsInGroup = contacts.map(({ Email }) => Email);
    const label = getRecipientGroupLabel(recipientGroup, contactsInGroup.length);

    const handleGroupModal = () => {
        setModalID(createModal());
    };

    const handleRemove = () => {
        if (messageSendInfo) {
            const { setMapSendInfo } = messageSendInfo;
            setMapSendInfo((mapSendInfo) => omit(mapSendInfo, emailsInGroup));
        }
        onRemove();
    };

    return (
        <>
            {modalID && (
                <AddressesGroupModal
                    recipientGroup={recipientGroup}
                    contacts={contactsInGroup}
                    messageSendInfo={messageSendInfo}
                    onSubmit={onChange}
                    onClose={() => hideModal(modalID)}
                    onExit={() => {
                        removeModal(modalID);
                        setModalID(null);
                    }}
                    {...getModal(modalID)}
                />
            )}
            <div className="composer-addresses-item mb0-5 mr0-5 bordered-container flex flex-nowrap flex-row mw80 stop-propagation">
                <span className="inline-flex composer-addresses-item-icon pl0-5 pr0-5 no-pointer-events-children h100">
                    <Icon name="contacts-groups" size={12} color={recipientGroup?.group?.Color} className="mauto" />
                </span>
                <span
                    className="composer-addresses-item-label mtauto mbauto pl0-5 ellipsis pr0-5"
                    onClick={handleGroupModal}
                >
                    {label}
                </span>
                <button
                    type="button"
                    className="composer-addresses-item-remove inline-flex pl0-5 pr0-5 no-pointer-events-children h100"
                    onClick={handleRemove}
                    title={c('Action').t`Remove`}
                >
                    <Icon name="off" size={12} className="mauto" />
                    <span className="sr-only">{c('Action').t`Remove`}</span>
                </button>
            </div>
        </>
    );
};

export default AddressesGroupItem;
