import { type FC, type PropsWithChildren, useContext } from 'react';
import { useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import Icon from '@proton/components/components/icon/Icon';
import { ConfirmationPrompt } from '@proton/pass/components/Confirmation/ConfirmationPrompt';
import { UpsellingContext } from '@proton/pass/components/Upsell/UpsellingProvider';
import { UpsellRef } from '@proton/pass/constants';
import { useAsyncModalHandles } from '@proton/pass/hooks/useAsyncModalHandles';
import { selectUserStorageAllowed } from '@proton/pass/store/selectors';

import { PassPlusPromotionButton } from '../Upsell/PassPlusPromotionButton';

type FileSummaryHeaderProps = PropsWithChildren<{
    deleteDisabled?: boolean;
    filesCount: number;
    loading?: boolean;
    onDelete?: () => void;
}>;

export const FileAttachmentsSummary: FC<FileSummaryHeaderProps> = ({
    children,
    deleteDisabled,
    filesCount,
    loading,
    onDelete,
}) => {
    const canUseStorage = useSelector(selectUserStorageAllowed);
    const deleteFile = useAsyncModalHandles<void, object>({ getInitialModalState: () => ({}) });
    const canDelete = filesCount > 0 && onDelete;
    const handleDeleteAll = () => deleteFile.handler({ onSubmit: () => onDelete?.() });

    /** Using the `UpsellingContext` directly instead of the
     * safe `useUpsell` hook as this component may be loaded
     * in a public-view where the provider isn't mounted. */
    const upsell = useContext(UpsellingContext);

    return (
        <div>
            <div className="flex justify-space-between items-center p-4 gap-4">
                <div className="shrink-0">
                    <Icon name="paper-clip" className="m-auto color-weak" />
                </div>
                <div className="flex-1 flex-column text-left">
                    <div className="text-ellipsis">{c('Pass_file_attachments').t`Attachments`}</div>
                    <div className="text-sm color-weak">
                        {(() => {
                            if (loading) return <CircleLoader size="small" />;
                            return filesCount === 0
                                ? c('Pass_file_attachments').t`Upload files from your device.`
                                : c('Pass_file_attachments').ngettext(
                                      msgid`${filesCount} file`,
                                      `${filesCount} files`,
                                      filesCount
                                  );
                        })()}
                    </div>
                </div>
                {!canUseStorage && upsell && (
                    <PassPlusPromotionButton
                        onClick={() => upsell({ type: 'pass-plus', upsellRef: UpsellRef.FILE_ATTACHMENTS })}
                    />
                )}
                {canDelete && (
                    <div className="shrink-0">
                        <Button
                            icon
                            shape="ghost"
                            color="weak"
                            onClick={handleDeleteAll}
                            title={c('Pass_file_attachments').t`Remove all files`}
                            disabled={deleteDisabled || loading}
                        >
                            <Icon name="trash" alt={c('Pass_file_attachments').t`Remove all files`} size={5} />
                        </Button>
                    </div>
                )}
            </div>
            {children}
            {deleteFile.state.open && (
                <ConfirmationPrompt
                    danger
                    onCancel={deleteFile.abort}
                    onConfirm={deleteFile.resolver}
                    title={c('Pass_file_attachments').t`Delete all files`}
                    message={c('Pass_file_attachments').t`Do you want to remove all the files?`}
                    confirmText={c('Action').t`Delete`}
                />
            )}
        </div>
    );
};
