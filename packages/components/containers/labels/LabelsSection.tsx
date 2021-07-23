import React, { useEffect, useState } from 'react';
import { c } from 'ttag';
import { arrayMove } from 'react-sortable-hoc';

import { orderLabels } from '@proton/shared/lib/api/labels';

import { Loader, Button, useDebounceInput } from '../../components';
import { useLabels, useEventManager, useModals, useApi, useNotifications, useLoading } from '../../hooks';

import { SettingsSection } from '../account';

import EditLabelModal from './modals/EditLabelModal';
import LabelSortableList from './LabelSortableList';

const DEBOUNCE_VALUE = 1800;

function LabelsSection() {
    const [labels = [], loadingLabels] = useLabels();
    const { call } = useEventManager();
    const api = useApi();
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();

    const labelsOrder = labels.map(({ ID }) => ID).join(',');

    const [localLabels, setLocalLabels] = useState(labels);
    const debouncedLabels = useDebounceInput(localLabels, DEBOUNCE_VALUE);

    /**
     * Refresh the list + update API and call event, it can be slow.
     * We want a responsive UI, if it fails the item will go back to its previous index
     * @param  {Number} oldIndex cf https://github.com/clauderic/react-sortable-hoc#basic-example
     * @param  {Number} newIndex
     */
    const onSortEnd = async ({ oldIndex, newIndex }: { oldIndex: number; newIndex: number }) => {
        const newLabels = arrayMove(localLabels, oldIndex, newIndex);
        setLocalLabels(newLabels);
    };

    const handleSortLabel = async () => {
        const newLabels = [...localLabels].sort((a, b) => a.Name.localeCompare(b.Name, undefined, { numeric: true }));
        setLocalLabels(newLabels);
        createNotification({ text: c('Success message after sorting labels').t`Labels sorted` });
    };

    useEffect(() => {
        const debouncedLabelOrder = debouncedLabels.map(({ ID }) => ID).join(',');

        if (!debouncedLabelOrder || debouncedLabelOrder === labelsOrder) {
            return;
        }

        const sync = async () => {
            await api(orderLabels({ LabelIDs: debouncedLabels.map(({ ID }) => ID) }));
            await call();
        };

        void sync();
    }, [debouncedLabels]);

    useEffect(() => {
        setLocalLabels(labels);
    }, [labels.length]);

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
                        {localLabels.length ? (
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
                    {localLabels.length ? <LabelSortableList items={localLabels} onSortEnd={onSortEnd} /> : null}
                </>
            )}
        </SettingsSection>
    );
}

export default LabelsSection;
