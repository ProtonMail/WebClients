import React, { useState, useEffect, useMemo, ComponentProps } from 'react';
import { c } from 'ttag';
import { DecryptedKey } from '@proton/shared/lib/interfaces';
import { ContactFormatted, ContactMergeModel } from '@proton/shared/lib/interfaces/contacts';

import { FormModal, Button, PrimaryButton } from '../../../components';
import { useEventManager } from '../../../hooks';

import MergeModalContent from './MergeModalContent';
import MergingModalContent from './MergingModalContent';

interface Props extends ComponentProps<typeof FormModal> {
    contacts: ContactFormatted[][];
    contactID: string;
    userKeysList: DecryptedKey[];
    onMerged: () => void;
}

const MergeModal = ({ contacts, contactID, userKeysList, onMerged, ...rest }: Props) => {
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
            rest.onClose();
        }
    }, [orderedContacts]);

    // beMergedModel = { 'ID of be-merged contact': [IDs to be merged] }
    // beDeletedModel = { 'ID of be-deleted contact': 'ID to navigate to in case it is the current ID' }
    const { beMergedModel, beDeletedModel, totalBeMerged } = useMemo(
        () =>
            orderedContacts.reduce<{
                beMergedModel: { [ID: string]: string[] };
                beDeletedModel: { [ID: string]: string };
                totalBeMerged: number;
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
                    }
                    return acc;
                },
                { beMergedModel: {}, beDeletedModel: {}, totalBeMerged: 0 }
            ),
        [orderedContacts, isChecked, beDeleted]
    );

    const { content, ...modalProps } = (() => {
        // Display table with mergeable contacts
        if (!isMerging) {
            const submit = (
                <PrimaryButton type="submit" disabled={!totalBeMerged}>{c('Action').t`Merge`}</PrimaryButton>
            );

            const handleSubmit = () => setIsMerging(true);

            return {
                title: c('Title').t`Merge contacts`,
                content: (
                    <MergeModalContent
                        contactID={contactID}
                        userKeysList={userKeysList}
                        model={model}
                        updateModel={setModel}
                        beMergedModel={beMergedModel}
                        beDeletedModel={beDeletedModel}
                    />
                ),
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
                    beMergedModel={beMergedModel}
                    beDeletedModel={beDeletedModel}
                    totalBeMerged={totalBeMerged}
                    onFinish={handleFinish}
                />
            ),
            close,
            submit,
            onSubmit: () => {
                onMerged?.();
                rest.onClose();
            },
            ...rest,
        };
    })();

    return <FormModal {...modalProps}>{content}</FormModal>;
};

export default MergeModal;
