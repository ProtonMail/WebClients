import { useEffect, useState } from 'react';

import isDeepEqual from 'lodash/isEqual';
import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import { Loader } from '@proton/atoms/Loader/Loader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { useModalTwoPromise } from '@proton/components/components/modalTwo/useModalTwo';
import MailUpsellButton from '@proton/components/components/upsell/MailUpsellButton';
import LabelsUpsellModal from '@proton/components/components/upsell/modals/LabelsUpsellModal';
import { SettingsCardSection } from '@proton/components/containers/account/SettingsCardSection';
import SettingsSection from '@proton/components/containers/account/SettingsSection';
import { SettingsLayoutVariant } from '@proton/components/containers/layout/interface';
import useDebounceInput from '@proton/hooks/useDebounceInput';
import useLoading from '@proton/hooks/useLoading';
import { categoriesThunk } from '@proton/mail/store/labels';
import { useLabels } from '@proton/mail/store/labels/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { CacheType } from '@proton/redux-utilities/interface';
import { orderLabels } from '@proton/shared/lib/api/labels';
import { MAIL_UPSELL_PATHS } from '@proton/shared/lib/constants';
import { hasReachedLabelLimit } from '@proton/shared/lib/helpers/folder';
import type { Label } from '@proton/shared/lib/interfaces/Label';
import move from '@proton/utils/move';

import LabelSortableList from './LabelSortableList';
import ConfirmSortModal from './modals/ConfirmSortModal';
import EditLabelModal from './modals/EditLabelModal';

const DEBOUNCE_VALUE = 1600;

const toLabelIDs = (labels: Label[]) => labels.map(({ ID }) => ID).join(',');

interface Props {
    showPromptOnAction?: boolean;
    /** The card variant shows the buttons above a card holding the labels, and no card without labels. */
    variant?: SettingsLayoutVariant;
}

function LabelsSection({ showPromptOnAction, variant = SettingsLayoutVariant.Default }: Props) {
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

    const actions = (
        <>
            {canCreateLabel ? (
                <Button color="norm" onClick={() => setEditLabelModalOpen(true)}>
                    {c('Action').t`Add label`}
                </Button>
            ) : (
                <MailUpsellButton onClick={handleClickUpsell} text={c('Action').t`Get more labels`} />
            )}
            {localLabels.length > 1 ? (
                <Button
                    shape="outline"
                    title={c('Title').t`Sort labels alphabetically`}
                    loading={loading}
                    onClick={() => withLoading(handleSortLabel())}
                >
                    {c('Action').t`Sort`}
                </Button>
            ) : null}
        </>
    );

    const modals = (
        <>
            {renderEditLabelModal && <EditLabelModal {...editLabelProps} type="label" />}

            {renderUpsellModal && (
                <LabelsUpsellModal
                    modalProps={upsellModalProps}
                    feature={MAIL_UPSELL_PATHS.UNLIMITED_LABELS}
                    isSettings
                />
            )}

            {confirmModal(({ onResolve, onReject, ...props }) => (
                <ConfirmSortModal modalProps={props} onReject={onReject} onResolve={onResolve} type="label" />
            ))}
        </>
    );

    if (variant === SettingsLayoutVariant.Card) {
        const hasLabels = !loadingLabels && !!localLabels.length;
        return (
            <>
                <SettingsCardSection
                    title={c('Title').t`Labels`}
                    description={c('Info')
                        .t`Labels are tags that make your messages easier to search and filter. A message can have several labels.`}
                    actions={loadingLabels ? <Loader /> : actions}
                    flush={hasLabels}
                >
                    {hasLabels ? (
                        <LabelSortableList items={localLabels} onSortEnd={onSortEnd} variant={variant} />
                    ) : null}
                </SettingsCardSection>
                {modals}
            </>
        );
    }

    return (
        <SettingsSection>
            {loadingLabels ? (
                <Loader />
            ) : (
                <>
                    <div className="flex gap-4 mb-7 labels-action">{actions}</div>
                    {localLabels.length ? <LabelSortableList items={localLabels} onSortEnd={onSortEnd} /> : null}
                </>
            )}
            {modals}
        </SettingsSection>
    );
}

export default LabelsSection;
