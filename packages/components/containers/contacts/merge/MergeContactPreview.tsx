import React, { useState, useEffect, useMemo, ComponentProps } from 'react';
import { c } from 'ttag';
import { splitKeys } from 'proton-shared/lib/keys/keys';
import { getContact } from 'proton-shared/lib/api/contacts';
import { prepareContact } from 'proton-shared/lib/contacts/decrypt';
import { noop } from 'proton-shared/lib/helpers/function';
import { toMap } from 'proton-shared/lib/helpers/object';
import { DecryptedKey } from 'proton-shared/lib/interfaces';
import { ContactProperties, ContactMergeModel } from 'proton-shared/lib/interfaces/contacts';
import { merge } from 'proton-shared/lib/contacts/helpers/merge';

import { useApi, useLoading, useEventManager, useContactEmails, useAddresses, useContactGroups } from '../../../hooks';
import { Loader, FormModal, PrimaryButton, Button } from '../../../components';
import ContactView from '../ContactView';
import MergeErrorContent from './MergeErrorContent';
import MergingModalContent from './MergingModalContent';

interface Props extends ComponentProps<typeof FormModal> {
    contactID: string;
    userKeysList: DecryptedKey[];
    beMergedModel: { [ID: string]: string[] };
    beDeletedModel: { [ID: string]: string };
    updateModel: React.Dispatch<React.SetStateAction<ContactMergeModel>>;
}

const MergeContactPreview = ({
    contactID,
    userKeysList,
    beMergedModel,
    beDeletedModel,
    updateModel,
    ...rest
}: Props) => {
    const { call } = useEventManager();
    const api = useApi();
    const { privateKeys, publicKeys } = useMemo(() => splitKeys(userKeysList), []);

    const [contactEmails, loadingContactEmails] = useContactEmails();

    const [addresses = [], loadingAddresses] = useAddresses();
    const ownAddresses = useMemo(() => addresses.map(({ Email }) => Email), [addresses]);

    const [contactGroups = [], loadingContactGroups] = useContactGroups();
    const contactGroupsMap = useMemo(() => toMap(contactGroups), [contactGroups]);

    const [loading, withLoading] = useLoading(true);
    const [isMerging, setIsMerging] = useState(false);
    const [mergeFinished, setMergeFinished] = useState(false);
    const [model, setModel] = useState<{
        mergedContact?: ContactProperties;
        errorOnMerge?: boolean;
        errorOnLoad?: boolean;
    }>({});

    const [beMergedIDs] = Object.values(beMergedModel);
    const beDeletedIDs = Object.keys(beDeletedModel);

    const handleRemoveMerged = () => {
        const beRemovedIDs = beMergedIDs.slice(1).concat(beDeletedIDs);
        updateModel((model) => ({
            ...model,
            orderedContacts: model.orderedContacts
                .map((group) => group.filter(({ ID }) => !beRemovedIDs.includes(ID)))
                .filter((group) => group.length > 1),
        }));
    };

    useEffect(() => {
        const mergeContacts = async () => {
            try {
                const beMergedContacts = [];
                for (const ID of beMergedIDs) {
                    const { Contact } = await api(getContact(ID));
                    const { properties, errors } = await prepareContact(Contact, { privateKeys, publicKeys });
                    if (errors.length) {
                        setModel({ ...model, errorOnLoad: true });
                        throw new Error('Error decrypting contact');
                    }
                    beMergedContacts.push(properties);
                }
                setModel({ ...model, mergedContact: merge(beMergedContacts) });
            } catch {
                setModel({ ...model, errorOnMerge: true });
            }
        };

        void withLoading(mergeContacts());
    }, []);

    const { content, ...modalProps } = (() => {
        // Display preview
        if (!isMerging) {
            const submit = (
                <PrimaryButton type="submit" disabled={!model.mergedContact}>
                    {c('Action').t`Merge`}
                </PrimaryButton>
            );
            const content = (() => {
                if (loadingContactEmails || loadingAddresses || loadingContactGroups || loading) {
                    return <Loader />;
                }
                if (model.errorOnLoad || model.errorOnMerge) {
                    const error = model.errorOnLoad
                        ? c('Warning')
                              .t`Some of the contacts to be merged display errors. Please review them individually`
                        : c('Warning').t`Contacts could not be merged`;

                    return <MergeErrorContent error={error} />;
                }

                return (
                    <ContactView
                        properties={model.mergedContact as ContactProperties}
                        contactID={contactID}
                        contactEmails={contactEmails}
                        contactGroupsMap={contactGroupsMap}
                        ownAddresses={ownAddresses}
                        userKeysList={userKeysList}
                        onDelete={noop}
                        onReload={noop}
                        isModal
                        isPreview
                    />
                );
            })();

            const handleSubmit = () => setIsMerging(true);

            return {
                content,
                title: c('Title').t`Contact Details`,
                submit,
                onSubmit: handleSubmit,
                ...rest,
            };
        }

        // Display progress bar while merging contacts
        const close = !mergeFinished && <Button type="reset">{c('Action').t`Cancel`}</Button>;
        const submit = (
            <PrimaryButton type="submit" loading={!mergeFinished}>
                {c('Action').t`Close`}
            </PrimaryButton>
        );

        const handleFinish = async () => {
            handleRemoveMerged();
            await call();
            setMergeFinished(true);
        };

        return {
            title: c('Title').t`Merging contacts`,
            hasClose: false,
            content: (
                <MergingModalContent
                    contactID={contactID}
                    userKeysList={userKeysList}
                    alreadyMerged={model.mergedContact as ContactProperties}
                    beMergedModel={beMergedModel}
                    beDeletedModel={beDeletedModel}
                    totalBeMerged={beMergedIDs.length}
                    onFinish={handleFinish}
                />
            ),
            close,
            submit,
            onSubmit: rest.onClose,
            ...rest,
        };
    })();

    return <FormModal {...modalProps}>{content}</FormModal>;
};

export default MergeContactPreview;
