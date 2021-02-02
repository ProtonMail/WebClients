import React from 'react';
import { c } from 'ttag';
import { arrayMove } from 'react-sortable-hoc';
import { orderLabels } from 'proton-shared/lib/api/labels';

import { Loader, Alert, PrimaryButton, Button } from '../../components';
import { useLabels, useEventManager, useModals, useApi, useNotifications, useLoading } from '../../hooks';
import LabelSortableList from './LabelSortableList';
import EditLabelModal from './modals/EditLabelModal';

function LabelsSection() {
    const [labels, loadingLabels] = useLabels();
    const { call } = useEventManager();
    const api = useApi();
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();

    /**
     * Refresh the list + update API and call event, it can be slow.
     * We want a responsive UI, if it fails the item will go back to its previous index
     * @param  {Number} oldIndex cf https://github.com/clauderic/react-sortable-hoc#basic-example
     * @param  {Number} newIndex
     */
    const onSortEnd = async ({ oldIndex, newIndex }) => {
        const newLabels = arrayMove(labels, oldIndex, newIndex);
        await api(
            orderLabels({
                LabelIDs: newLabels.map(({ ID }) => ID),
            })
        );
        await call();
    };

    const getScrollContainer = () => document.querySelector('.main-area');

    const handleSortLabel = async () => {
        const LabelIDs = [...labels]
            .sort((a, b) => a.Name.localeCompare(b.Name, undefined, { numeric: true }))
            .map(({ ID }) => ID);
        await api(orderLabels({ LabelIDs }));
        await call();
        createNotification({ text: c('Success message after sorting labels').t`Labels sorted` });
    };

    if (loadingLabels) {
        return <Loader />;
    }

    return (
        <>
            <Alert
                type="info"
                className="mt1 mb1"
                learnMore="https://protonmail.com/support/knowledge-base/creating-folders/"
            >
                {c('LabelSettings').t`Multiple labels can be applied to a single message.`}
            </Alert>
            <div className="mb1">
                <PrimaryButton className="mr1" onClick={() => createModal(<EditLabelModal type="label" />)}>
                    {c('Action').t`Add label`}
                </PrimaryButton>
                <Button
                    title={c('Title').t`Sort labels alphabetically`}
                    loading={loading}
                    onClick={() => withLoading(handleSortLabel())}
                >{c('Action').t`Sort`}</Button>
            </div>
            {labels.length ? (
                <LabelSortableList getContainer={getScrollContainer} items={labels} onSortEnd={onSortEnd} />
            ) : (
                <Alert>{c('LabelSettings').t`No labels available`}</Alert>
            )}
        </>
    );
}

export default LabelsSection;
