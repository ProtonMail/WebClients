import { useRef, useState, useEffect } from 'react';

import { splitKeys } from '@proton/shared/lib/keys';
import { prepareContact, CryptoProcessingError } from '@proton/shared/lib/contacts/decrypt';
import { DecryptedKey } from '@proton/shared/lib/interfaces';
import { Contact, ContactProperties } from '@proton/shared/lib/interfaces/contacts/Contact';

export type ContactPropertiesModel = {
    ID?: string;
    properties?: ContactProperties;
    errors?: CryptoProcessingError[];
};

interface Props {
    userKeysList: DecryptedKey[];
    contact: Contact;
}

const useContactProperties = ({ contact, userKeysList }: Props): [ContactPropertiesModel, () => void] => {
    const ref = useRef('');
    const [model, setModel] = useState<ContactPropertiesModel>({});
    const [forceRefresh, setForceRefresh] = useState({});

    useEffect(() => {
        if (contact && userKeysList.length) {
            ref.current = contact.ID;
            const { publicKeys, privateKeys } = splitKeys(userKeysList);

            void prepareContact(contact, { publicKeys, privateKeys }).then(({ properties, errors }) => {
                if (ref.current !== contact.ID) {
                    return;
                }
                setModel({ ID: contact.ID, properties, errors });
            });
        }
    }, [contact, userKeysList, forceRefresh]);

    const handleForceRefresh = () => {
        setModel({});
        setForceRefresh({});
    };

    return [model, handleForceRefresh];
};

export default useContactProperties;
