import React from 'react';
import { c } from 'ttag';
import { arrayMove } from 'react-sortable-hoc';

import { orderLabels } from 'proton-shared/lib/api/labels';

import { Loader, Button } from '../../components';
import { useLabels, useEventManager, useModals, useApi, useNotifications, useLoading } from '../../hooks';

import { SettingsSection } from '../account';

import EditLabelModal from './modals/EditLabelModal';
import LabelSortableList from './LabelSortableList';

function LabelsSection() {
    const [labels = [], loadingLabels] = useLabels();
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
    const onSortEnd = async ({ oldIndex, newIndex }: { oldIndex: number; newIndex: number }) => {
        const newLabels = arrayMove(labels, oldIndex, newIndex);
        await api(
            orderLabels({
                LabelIDs: newLabels.map(({ ID }) => ID),
            })
        );
        await call();
    };

    const handleSortLabel = async () => {
        const LabelIDs = [...labels]
            .sort((a, b) => a.Name.localeCompare(b.Name, undefined, { numeric: true }))
            .map(({ ID }) => ID);
        await api(orderLabels({ LabelIDs }));
        await call();
        createNotification({ text: c('Success message after sorting labels').t`Labels sorted` });
    };

    return (
        <SettingsSection>
            {loadingLabels ? (
                <Loader />
            ) : (
                <>
                    <div className="mb2">
                        <Button color="norm" onClick={() => createModal(<EditLabelModal type="label" />)}>
                            {c('Action').t`Add label`}
                        </Button>
                        {labels.length ? (
                            <Button
                                shape="outline"
                                className="ml1"
                                title={c('Title').t`Sort labels alphabetically`}
                                loading={loading}
                                onClick={() => withLoading(handleSortLabel())}
                            >
                                {c('Action').t`Sort`}
                            </Button>
                        ) : null}
                    </div>
                    {labels.length ? <LabelSortableList items={labels} onSortEnd={onSortEnd} /> : null}
                </>
            )}
        </SettingsSection>
    );
}

export default LabelsSection;
