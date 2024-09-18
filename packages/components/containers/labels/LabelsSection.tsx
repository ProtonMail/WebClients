import { useEffect, useState } from 'react';
import { arrayMove } from 'react-sortable-hoc';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import useDebounceInput from '@proton/components/components/input/useDebounceInput';
import Loader from '@proton/components/components/loader/Loader';
import MailUpsellButton from '@proton/components/components/upsell/MailUpsellButton';
import LabelsUpsellModal from '@proton/components/components/upsell/modal/types/LabelsUpsellModal';
import { useLoading } from '@proton/hooks';
import { orderLabels } from '@proton/shared/lib/api/labels';
import { MAIL_UPSELL_PATHS } from '@proton/shared/lib/constants';
import { hasReachedLabelLimit } from '@proton/shared/lib/helpers/folder';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import type { Label } from '@proton/shared/lib/interfaces';

import { useModalState } from '../../components';
import { useApi, useEventManager, useLabels, useNotifications, useUser } from '../../hooks';
import { SettingsSection } from '../account';
import LabelSortableList from './LabelSortableList';
import EditLabelModal from './modals/EditLabelModal';

const DEBOUNCE_VALUE = 1600;

const toLabelIDs = (labels: Label[]) => labels.map(({ ID }) => ID).join(',');

function LabelsSection() {
    const [user] = useUser();
    const [labels = [], loadingLabels] = useLabels();
    const { call } = useEventManager();
    const api = useApi();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();

    const [localLabels, setLocalLabels] = useState(labels);
    const debouncedLabels = useDebounceInput(localLabels, DEBOUNCE_VALUE);

    const labelsOrder = toLabelIDs(labels);
    const debouncedLabelOrder = toLabelIDs(debouncedLabels);

    const canCreateLabel = !hasReachedLabelLimit(user, labels);

    const [editLabelProps, setEditLabelModalOpen] = useModalState();
    const [upsellModalProps, handleUpsellModalDisplay, renderUpsellModal] = useModalState();

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
                    <div className="flex gap-4 mb-7 labels-action">
                        {canCreateLabel ? (
                            <Button color="norm" onClick={() => setEditLabelModalOpen(true)}>
                                {c('Action').t`Add label`}
                            </Button>
                        ) : (
                            <MailUpsellButton
                                onClick={() => handleUpsellModalDisplay(true)}
                                text={c('Action').t`Get more labels`}
                            />
                        )}
                        {localLabels.length ? (
                            <Button
                                shape="outline"
                                title={c('Title').t`Sort labels alphabetically`}
                                loading={loading}
                                onClick={() => withLoading(handleSortLabel())}
                            >
                                {c('Action').t`Sort`}
                            </Button>
                        ) : null}
                    </div>
                    {localLabels.length ? <LabelSortableList items={localLabels} onSortEnd={onSortEnd} /> : null}

                    <EditLabelModal {...editLabelProps} type="label" />

                    {renderUpsellModal && (
                        <LabelsUpsellModal
                            modalProps={upsellModalProps}
                            feature={MAIL_UPSELL_PATHS.UNLIMITED_LABELS}
                            isSettings
                        />
                    )}
                </>
            )}
        </SettingsSection>
    );
}

export default LabelsSection;
