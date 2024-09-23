import type { Dispatch, SetStateAction } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { ContactFormatted, ContactMergeModel } from '@proton/shared/lib/interfaces/contacts';
import move from '@proton/utils/move';

import type { ContactMergePreviewModalProps } from './ContactMergePreviewModal';
import MergeTable from './table/MergeTable';

interface Props {
    model: ContactMergeModel;
    updateModel: Dispatch<SetStateAction<ContactMergeModel>>;
    onSubmit: () => void;
    onClose?: () => void;
    beMergedModel: { [ID: string]: string[] };
    beDeletedModel: { [ID: string]: string };
    totalBeMerged: number;
    totalBeDeleted: number;
    onMergeDetails: (contactID: string) => void;
    onMergePreview: (props: ContactMergePreviewModalProps) => void;
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

const ContactMergeTableContent = ({
    model,
    updateModel,
    onSubmit,
    onClose,
    beMergedModel,
    beDeletedModel,
    totalBeMerged,
    totalBeDeleted,
    onMergeDetails,
    onMergePreview,
}: Props) => {
    const { orderedContacts, isChecked, beDeleted } = model;

    const isDeleteOnly = totalBeMerged <= 0 && totalBeDeleted > 0;

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

    const handlePreview = (beMergedID: string, beDeletedIDs: string[]) => {
        const beMergedModelSingle = { [beMergedID]: beMergedModel[beMergedID] };
        const beDeletedModelSingle = beDeletedIDs.reduce<{ [ID: string]: string }>((acc, ID) => {
            acc[ID] = beDeletedModel[ID];
            return acc;
        }, {});

        onMergePreview({
            beMergedModel: beMergedModelSingle,
            beDeletedModel: beDeletedModelSingle,
            updateModel,
        });
    };

    return (
        <>
            <ModalTwoHeader title={c('Title').t`Merge contacts`} />
            <ModalTwoContent>
                <Alert className="mb-4">
                    {c('Description')
                        .t`Use Drag and Drop to rank merging priority between contacts. Uncheck the contacts you do not want to merge.`}
                </Alert>
                <Alert className="mb-4" type="warning">
                    {c('Description')
                        .t`You can mark for deletion the contacts that you do not want neither to merge nor to keep. Deletion will only take place after the merge button is clicked`}
                </Alert>
                <MergeTable
                    onSortEnd={handleSortEnd}
                    contacts={orderedContacts}
                    isChecked={isChecked}
                    beDeleted={beDeleted}
                    onClickCheckbox={handleToggleCheck}
                    onClickDetails={onMergeDetails}
                    onToggleDelete={handleToggleDelete}
                    onClickPreview={handlePreview}
                />
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose} data-testid="merge-model-cancel-button">{c('Action').t`Cancel`}</Button>
                {isDeleteOnly ? (
                    <Button color="norm" onClick={onSubmit}>{c('Action').t`Continue`}</Button>
                ) : (
                    <Button
                        color="norm"
                        disabled={!totalBeMerged}
                        onClick={onSubmit}
                        data-testid="merge-model-merge-button"
                    >
                        {c('Action').t`Merge`}
                    </Button>
                )}
            </ModalTwoFooter>
        </>
    );
};

export default ContactMergeTableContent;
