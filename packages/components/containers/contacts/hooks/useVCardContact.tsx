import { useEffect, useRef, useState } from 'react';

import type { CryptoProcessingError } from '@proton/shared/lib/contacts/decrypt';
import { prepareVCardContact } from '@proton/shared/lib/contacts/decrypt';
import type { DecryptedKey } from '@proton/shared/lib/interfaces';
import type { Contact } from '@proton/shared/lib/interfaces/contacts/Contact';
import type { VCardContact } from '@proton/shared/lib/interfaces/contacts/VCard';
import { splitKeys } from '@proton/shared/lib/keys';

export type VCardContactModel = {
    ID?: string;
    vCardContact?: VCardContact;
    errors?: (CryptoProcessingError | Error)[];
    isVerified?: boolean;
};

interface Props {
    contact: Contact | undefined;
    userKeysList?: DecryptedKey[];
}

const useVCardContact = ({
    contact,
    userKeysList,
}: Props): VCardContactModel & { isLoading: boolean; onReload: () => void } => {
    const ref = useRef('');
    const [model, setModel] = useState<VCardContactModel>();
    const [forceRefresh, setForceRefresh] = useState({});

    useEffect(() => {
        if (contact && userKeysList?.length) {
            const prepare = async () => {
                ref.current = contact.ID;
                const { publicKeys, privateKeys } = splitKeys(userKeysList);

                const { vCardContact, errors, isVerified } = await prepareVCardContact(contact, {
                    publicKeys,
                    privateKeys,
                });

                if (ref.current !== contact.ID) {
                    return;
                }
                setModel({ ID: contact.ID, vCardContact, errors, isVerified });
            };

            void prepare();
        }
    }, [contact, userKeysList, forceRefresh]);

    const handleForceRefresh = () => {
        setModel({});
        setForceRefresh({});
    };

    const isLoading = !model?.ID;

    return { ...model, isLoading, onReload: handleForceRefresh };
};

export default useVCardContact;
