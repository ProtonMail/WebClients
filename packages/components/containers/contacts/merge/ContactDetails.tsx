import React, { useState, useEffect, useMemo, ComponentProps } from 'react';
import { c } from 'ttag';
import { splitKeys } from '@proton/shared/lib/keys/keys';
import { getContact } from '@proton/shared/lib/api/contacts';
import { CryptoProcessingError, prepareContact } from '@proton/shared/lib/contacts/decrypt';
import { noop } from '@proton/shared/lib/helpers/function';
import { toMap } from '@proton/shared/lib/helpers/object';
import { CRYPTO_PROCESSING_TYPES } from '@proton/shared/lib/contacts/constants';
import { DecryptedKey } from '@proton/shared/lib/interfaces';
import { ContactProperties } from '@proton/shared/lib/interfaces/contacts';

import { Loader, FormModal, PrimaryButton } from '../../../components';
import { useApi, useLoading, useContactEmails, useAddresses, useContactGroups } from '../../../hooks';
import ContactView from '../ContactView';

interface Props extends ComponentProps<typeof FormModal> {
    contactID: string;
    userKeysList: DecryptedKey[];
}

const ContactDetails = ({ contactID, userKeysList, ...rest }: Props) => {
    const api = useApi();
    const [loading, withLoading] = useLoading(true);
    const [model, setModel] = useState<{ properties: ContactProperties; errors: CryptoProcessingError[] }>({
        properties: [],
        errors: [],
    });

    const [contactEmails, loadingContactEmails] = useContactEmails();

    const [addresses = [], loadingAddresses] = useAddresses();
    const ownAddresses = useMemo(() => addresses.map(({ Email }) => Email), [addresses]);

    const [contactGroups = [], loadingContactGroups] = useContactGroups();
    const contactGroupsMap = useMemo(() => toMap(contactGroups), [contactGroups]);

    useEffect(() => {
        const request = async () => {
            const { Contact } = await api(getContact(contactID));
            const { properties, errors } = await prepareContact(Contact, splitKeys(userKeysList));
            setModel({ properties, errors });
        };

        try {
            void withLoading(request());
        } catch (error) {
            setModel({ ...model, errors: [{ type: CRYPTO_PROCESSING_TYPES.FAIL_TO_LOAD, error }] });
        }
    }, []);

    return (
        <FormModal
            title={c('Title').t`Contact Details`}
            onSubmit={rest.onClose}
            footer={<PrimaryButton type="submit">{c('Action').t`Close`}</PrimaryButton>}
            {...rest}
        >
            {loading || loadingContactEmails || loadingAddresses || loadingContactGroups ? (
                <Loader />
            ) : (
                <ContactView
                    properties={model.properties}
                    errors={model.errors}
                    contactID={contactID}
                    userKeysList={userKeysList}
                    onDelete={noop}
                    isModal
                    isPreview
                    contactEmails={contactEmails}
                    contactGroupsMap={contactGroupsMap}
                    ownAddresses={ownAddresses}
                    onReload={noop}
                />
            )}
        </FormModal>
    );
};

export default ContactDetails;
