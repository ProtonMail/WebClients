import React, { useEffect, useState } from 'react';
import { c } from 'ttag';
import { arrayMove } from 'react-sortable-hoc';

import { orderLabels } from '@proton/shared/lib/api/labels';
import { Label } from '@proton/shared/lib/interfaces';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';

import { Loader, Button, useDebounceInput } from '../../components';
import { useLabels, useEventManager, useModals, useApi, useNotifications, useLoading } from '../../hooks';

import { SettingsSection } from '../account';

import EditLabelModal from './modals/EditLabelModal';
import LabelSortableList from './LabelSortableList';

const DEBOUNCE_VALUE = 1600;

const toLabelIDs = (labels: Label[]) => labels.map(({ ID }) => ID).join(',');

function LabelsSection() {
    const [labels = [], loadingLabels] = useLabels();
    const { call } = useEventManager();
    const api = useApi();
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();

    const [localLabels, setLocalLabels] = useState(labels);
    const debouncedLabels = useDebounceInput(localLabels, DEBOUNCE_VALUE);

    const labelsOrder = toLabelIDs(labels);
    const debouncedLabelOrder = toLabelIDs(debouncedLabels);

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
        if (isDeepEqual(debouncedLabels, labels)) {
            return;
        }
        setLocalLabels(labels);
    }, [labels]);

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
