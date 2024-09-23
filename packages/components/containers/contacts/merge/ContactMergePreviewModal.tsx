import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useMemo, useState } from 'react';

import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import { useLoading } from '@proton/hooks';
import { getContact } from '@proton/shared/lib/api/contacts';
import { processApiRequestsSafe } from '@proton/shared/lib/api/helpers/safeApiRequests';
import { prepareVCardContact } from '@proton/shared/lib/contacts/decrypt';
import { merge } from '@proton/shared/lib/contacts/helpers/merge';
import type { Contact, ContactMergeModel } from '@proton/shared/lib/interfaces/contacts';
import type { VCardContact } from '@proton/shared/lib/interfaces/contacts/VCard';
import { splitKeys } from '@proton/shared/lib/keys/keys';

import { useApi, useEventManager, useUserKeys } from '../../../hooks';
import ContactMergeErrorContent from './ContactMergeErrorContent';
import ContactMergeViewContent from './ContactMergeViewContent';
import MergingModalContent from './ContactMergingContent';

export interface ContactMergePreviewModalProps {
    beMergedModel: { [ID: string]: string[] };
    beDeletedModel: { [ID: string]: string };
    updateModel: Dispatch<SetStateAction<ContactMergeModel>>;
}

type Props = ContactMergePreviewModalProps & ModalProps;

const ContactMergePreviewModal = ({ beMergedModel, beDeletedModel, updateModel, ...rest }: Props) => {
    const { call } = useEventManager();
    const api = useApi();
    const [userKeysList] = useUserKeys();
    const { privateKeys, publicKeys } = useMemo(() => splitKeys(userKeysList), [userKeysList]);

    const [loading, withLoading] = useLoading(true);
    const [isMerging, setIsMerging] = useState(false);
    const [mergeFinished, setMergeFinished] = useState(false);
    const [model, setModel] = useState<{
        mergedVCardContact?: VCardContact;
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
                const requests = beMergedIDs.map((ID: string) => async () => {
                    const { Contact } = await api<{ Contact: Contact }>(getContact(ID));
                    const { vCardContact, errors } = await prepareVCardContact(Contact, { privateKeys, publicKeys });
                    if (errors.length) {
                        setModel({ ...model, errorOnLoad: true });
                        throw new Error('Error decrypting contact');
                    }
                    return vCardContact;
                });
                const beMergedContacts = await processApiRequestsSafe(requests);
                const mergedVCardContact = merge(beMergedContacts.map((vCardContact) => vCardContact));
                setModel({ ...model, mergedVCardContact });
            } catch (e: any) {
                setModel({ ...model, errorOnMerge: true });
            }
        };

        void withLoading(mergeContacts());
    }, []);

    const hasError = model.errorOnLoad || model.errorOnMerge;

    const handleStartMerge = () => {
        setIsMerging(true);
    };

    const handleMergingFinish = async () => {
        handleRemoveMerged();
        await call();
        setMergeFinished(true);
    };

    return (
        <ModalTwo size="large" className="contacts-modal" {...rest}>
            {hasError ? (
                <ContactMergeErrorContent model={model} onClose={rest.onClose} />
            ) : (
                <>
                    {isMerging ? (
                        <MergingModalContent
                            alreadyMerged={model.mergedVCardContact}
                            mergeFinished={mergeFinished}
                            beMergedModel={beMergedModel}
                            beDeletedModel={beDeletedModel}
                            totalBeMerged={beMergedIDs.length}
                            totalBeDeleted={beDeletedIDs.length}
                            onFinish={handleMergingFinish}
                            onMerged={rest.onClose}
                            onClose={rest.onClose}
                        />
                    ) : (
                        <ContactMergeViewContent
                            contact={model.mergedVCardContact}
                            loading={loading}
                            beMergedIDs={beMergedIDs}
                            onSubmit={handleStartMerge}
                            onClose={rest.onClose}
                        />
                    )}
                </>
            )}
        </ModalTwo>
    );
};

export default ContactMergePreviewModal;
