import { useEffect, useState } from 'react';

import isDeepEqual from 'lodash/isEqual';
import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import useDebounceInput from '@proton/components/components/input/useDebounceInput';
import Loader from '@proton/components/components/loader/Loader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { useModalTwoPromise } from '@proton/components/components/modalTwo/useModalTwo';
import MailUpsellButton from '@proton/components/components/upsell/MailUpsellButton';
import LabelsUpsellModal from '@proton/components/components/upsell/modals/LabelsUpsellModal';
import SettingsSection from '@proton/components/containers/account/SettingsSection';
import ConfirmSortModal from '@proton/components/containers/labels/modals/ConfirmSortModal';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { categoriesThunk } from '@proton/mail/store/labels';
import { useLabels } from '@proton/mail/store/labels/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { CacheType } from '@proton/redux-utilities';
import { orderLabels } from '@proton/shared/lib/api/labels';
import { MAIL_UPSELL_PATHS } from '@proton/shared/lib/constants';
import { hasReachedLabelLimit } from '@proton/shared/lib/helpers/folder';
import type { Label } from '@proton/shared/lib/interfaces';
import move from '@proton/utils/move';

import LabelSortableList from './LabelSortableList';
import EditLabelModal from './modals/EditLabelModal';

const DEBOUNCE_VALUE = 1600;

const toLabelIDs = (labels: Label[]) => labels.map(({ ID }) => ID).join(',');

interface Props {
    showPromptOnAction?: boolean;
}

function LabelsSection({ showPromptOnAction }: Props) {
    const [user] = useUser();
    const [labels = [], loadingLabels] = useLabels();
    const dispatch = useDispatch();
    const api = useApi();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();

    const [localLabels, setLocalLabels] = useState(labels);
    const debouncedLabels = useDebounceInput(localLabels, DEBOUNCE_VALUE);

    const labelsOrder = toLabelIDs(labels);
    const debouncedLabelOrder = toLabelIDs(debouncedLabels);

    const canCreateLabel = !hasReachedLabelLimit(user, labels);

    const [editLabelProps, setEditLabelModalOpen, renderEditLabelModal] = useModalState();
    const [upsellModalProps, handleUpsellModalDisplay, renderUpsellModal] = useModalState();
    const [confirmModal, showConfirmModal] = useModalTwoPromise();

    /**
     * Refresh the list + update API and call event, it can be slow.
     * We want a responsive UI, if it fails the item will go back to its previous index
     * @param  {Number} oldIndex
     * @param  {Number} newIndex
     */
    const onSortEnd = async ({ oldIndex, newIndex }: { oldIndex: number; newIndex: number }) => {
        const newLabels = move(localLabels, oldIndex, newIndex);
        setLocalLabels(newLabels);
    };

    const handleSortLabel = async () => {
        if (showPromptOnAction) {
            await showConfirmModal();
        }
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
            await dispatch(categoriesThunk({ cache: CacheType.None }));
        };

        void sync();
    }, [debouncedLabels]);

    useEffect(() => {
        if (isDeepEqual(debouncedLabels, labels)) {
            return;
        }
        setLocalLabels(labels);
    }, [labels]);

    const handleClickUpsell = () => {
        // For ET iOS, show the native upsell modal
        if ((window as any).webkit?.messageHandlers.upsell) {
            (window as any).webkit?.messageHandlers.upsell.postMessage('labels-action');
            return;
        } else {
            handleUpsellModalDisplay(true);
        }
    };

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
                            <MailUpsellButton onClick={handleClickUpsell} text={c('Action').t`Get more labels`} />
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

                    {renderEditLabelModal && <EditLabelModal {...editLabelProps} type="label" />}

                    {renderUpsellModal && (
                        <LabelsUpsellModal
                            modalProps={upsellModalProps}
                            feature={MAIL_UPSELL_PATHS.UNLIMITED_LABELS}
                            isSettings
                        />
                    )}
                </>
            )}

            {confirmModal(({ onResolve, onReject, ...props }) => (
                <ConfirmSortModal modalProps={props} onReject={onReject} onResolve={onResolve} type="label" />
            ))}
        </SettingsSection>
    );
}

export default LabelsSection;
