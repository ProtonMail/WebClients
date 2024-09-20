import { useEffect, useMemo, useState } from 'react';

import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import type { ContactFormatted, ContactMergeModel } from '@proton/shared/lib/interfaces/contacts';

import { useEventManager } from '../../../hooks';
import type { ContactMergePreviewModalProps } from './ContactMergePreviewModal';
import ContactMergeTableContent from './ContactMergeTableContent';
import ContactMergingContent from './ContactMergingContent';

export interface ContactMergeProps {
    contacts: ContactFormatted[][];
    onMerged: () => void;
}

export interface ContactMergeModalProps {
    onMergeDetails: (contactID: string) => void;
    onMergePreview: (props: ContactMergePreviewModalProps) => void;
}

type Props = ContactMergeProps & ContactMergeModalProps & ModalProps;

const ContactMergeModal = ({ contacts, onMerged, onMergeDetails, onMergePreview, ...rest }: Props) => {
    const { call } = useEventManager();

    const [isMerging, setIsMerging] = useState(false);
    const [mergeFinished, setMergeFinished] = useState(false);
    const [model, setModel] = useState<ContactMergeModel>(() => ({
        orderedContacts: contacts,
        isChecked: contacts.flat().reduce<{ [ID: string]: boolean }>((acc, { ID }) => {
            acc[ID] = true;
            return acc;
        }, {}),
        beDeleted: contacts.flat().reduce<{ [ID: string]: boolean }>((acc, { ID }) => {
            acc[ID] = false;
            return acc;
        }, {}),
    }));

    const { orderedContacts, isChecked, beDeleted } = model;

    useEffect(() => {
        // close the modal if all contacts have been merged from preview
        if (!orderedContacts.flat().length) {
            onMerged?.();
            rest.onClose?.();
        }
    }, [orderedContacts]);

    // beMergedModel = { 'ID of be-merged contact': [IDs to be merged] }
    // beDeletedModel = { 'ID of be-deleted contact': 'ID to navigate to in case it is the current ID' }
    const { beMergedModel, beDeletedModel, totalBeMerged, totalBeDeleted } = useMemo(
        () =>
            orderedContacts.reduce<{
                beMergedModel: { [ID: string]: string[] };
                beDeletedModel: { [ID: string]: string };
                totalBeMerged: number;
                totalBeDeleted: number;
            }>(
                (acc, group) => {
                    const groupIDs = group.map(({ ID }) => ID);
                    const beMergedIDs = groupIDs
                        .map((ID) => isChecked[ID] && !beDeleted[ID] && ID)
                        .filter(Boolean) as string[];
                    const beDeletedIDs = groupIDs.map((ID) => beDeleted[ID] && ID).filter(Boolean) as string[];
                    const willBeMerged = beMergedIDs.length > 1;

                    if (willBeMerged) {
                        acc.beMergedModel[beMergedIDs[0]] = beMergedIDs;
                        acc.totalBeMerged += beMergedIDs.length;
                    }
                    for (const ID of beDeletedIDs) {
                        // route to merged contact or to /contacts if no associated contact is merged
                        acc.beDeletedModel[ID] = willBeMerged ? beMergedIDs[0] : '';
                        acc.totalBeDeleted += 1;
                    }
                    return acc;
                },
                { beMergedModel: {}, beDeletedModel: {}, totalBeMerged: 0, totalBeDeleted: 0 }
            ),
        [orderedContacts, isChecked, beDeleted]
    );

    const handleStartMerge = () => {
        setIsMerging(true);
    };

    const handleMergingFinish = async () => {
        await call();
        setMergeFinished(true);
    };

    const handleMerged = () => {
        onMerged?.();
        rest.onClose?.();
    };

    return (
        <ModalTwo size="large" className="contacts-modal" {...rest}>
            {isMerging ? (
                <ContactMergingContent
                    mergeFinished={mergeFinished}
                    onFinish={handleMergingFinish}
                    onMerged={handleMerged}
                    onClose={rest.onClose}
                    beMergedModel={beMergedModel}
                    beDeletedModel={beDeletedModel}
                    totalBeMerged={totalBeMerged}
                    totalBeDeleted={totalBeDeleted}
                />
            ) : (
                <ContactMergeTableContent
                    model={model}
                    updateModel={setModel}
                    onSubmit={handleStartMerge}
                    onClose={rest.onClose}
                    beMergedModel={beMergedModel}
                    beDeletedModel={beDeletedModel}
                    totalBeMerged={totalBeMerged}
                    totalBeDeleted={totalBeDeleted}
                    onMergeDetails={onMergeDetails}
                    onMergePreview={onMergePreview}
                />
            )}
        </ModalTwo>
    );
};

export default ContactMergeModal;
