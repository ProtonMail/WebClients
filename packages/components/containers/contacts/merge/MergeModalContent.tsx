import React from 'react';
import { c } from 'ttag';
import { move } from '@proton/shared/lib/helpers/array';
import { DecryptedKey } from '@proton/shared/lib/interfaces';
import { ContactFormatted, ContactMergeModel } from '@proton/shared/lib/interfaces/contacts';

import { Alert } from '../../../components';
import { useModals } from '../../../hooks';
import ContactDetails from './ContactDetails';
import MergeContactPreview from './MergeContactPreview';
import MergeTable from './MergeTable';

interface Props {
    userKeysList: DecryptedKey[];
    model: ContactMergeModel;
    updateModel: React.Dispatch<React.SetStateAction<ContactMergeModel>>;
    beMergedModel: { [ID: string]: string[] };
    beDeletedModel: { [ID: string]: string };
}

/**
 * Re-order elements in an array inside a group of arrays
 */
const moveInGroup = (
    collection: ContactFormatted[][],
    groupIndex: number,
    { oldIndex, newIndex }: { oldIndex: number; newIndex: number }
) => {
    return collection.map((group, i) => {
        if (i === groupIndex) {
            return move(group, oldIndex, newIndex);
        }
        return group;
    });
};

const MergeModalContent = ({ userKeysList, model, updateModel, beMergedModel, beDeletedModel }: Props) => {
    const { createModal } = useModals();

    const { orderedContacts, isChecked, beDeleted } = model;

    const handleToggleCheck = (ID: string) => {
        updateModel((model) => ({
            ...model,
            isChecked: { ...isChecked, [ID]: !isChecked[ID] },
        }));
    };
    const handleToggleDelete = (ID: string) => {
        updateModel((model) => ({
            ...model,
            beDeleted: { ...beDeleted, [ID]: !beDeleted[ID] },
        }));
    };
    const handleSortEnd =
        (groupIndex: number) =>
        ({ oldIndex, newIndex }: { oldIndex: number; newIndex: number }) => {
            updateModel((model) => ({
                ...model,
                orderedContacts: moveInGroup(orderedContacts, groupIndex, { oldIndex, newIndex }),
            }));
        };

    const handleClickDetails = (contactID: string) => {
        createModal(<ContactDetails contactID={contactID} userKeysList={userKeysList} />);
    };

    const handlePreview = (beMergedID: string, beDeletedIDs: string[]) => {
        const beMergedModelSingle = { [beMergedID]: beMergedModel[beMergedID] };
        const beDeletedModelSingle = beDeletedIDs.reduce<{ [ID: string]: string }>((acc, ID) => {
            acc[ID] = beDeletedModel[ID];
            return acc;
        }, {});

        createModal(
            <MergeContactPreview
                userKeysList={userKeysList}
                beMergedModel={beMergedModelSingle}
                beDeletedModel={beDeletedModelSingle}
                updateModel={updateModel}
            />
        );
    };

    return (
        <>
            <Alert>
                {c('Description')
                    .t`Use Drag and Drop to rank merging priority between contacts. Uncheck the contacts you do not want to merge.`}
            </Alert>
            <Alert type="warning">
                {c('Description')
                    .t`You can mark for deletion the contacts that you do not want neither to merge nor to keep. Deletion will only take place after the merge button is clicked`}
            </Alert>
            <MergeTable
                onSortEnd={handleSortEnd}
                contacts={orderedContacts}
                isChecked={isChecked}
                beDeleted={beDeleted}
                onClickCheckbox={handleToggleCheck}
                onClickDetails={handleClickDetails}
                onToggleDelete={handleToggleDelete}
                onClickPreview={handlePreview}
            />
        </>
    );
};

export default MergeModalContent;
