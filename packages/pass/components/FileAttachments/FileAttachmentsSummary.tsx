import type { FC, PropsWithChildren } from 'react';
import { useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/index';
import Icon from '@proton/components/components/icon/Icon';
import { ConfirmationPrompt } from '@proton/pass/components/Confirmation/ConfirmationPrompt';
import { useUpselling } from '@proton/pass/components/Upsell/UpsellingProvider';
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
    const upsell = useUpselling();

    const deleteFile = useAsyncModalHandles<void, object>({ getInitialModalState: () => ({}) });
    const canDelete = filesCount > 0 && onDelete;
    const handleDeleteAll = () => deleteFile.handler({ onSubmit: () => onDelete?.() });

    return (
        <div>
            <div className="flex justify-space-between items-center p-4 gap-4">
                <div className="shrink-0">
                    <Icon name="paper-clip" className="m-auto color-weak" />
                </div>
                <div className="flex-1 flex-column text-left">
                    <div className="text-ellipsis">{c('Title').t`Attachments`}</div>
                    <div className="text-sm color-weak">
                        {(() => {
                            if (loading) return <CircleLoader size="small" />;
                            return filesCount === 0
                                ? c('Title').t`Upload files from your device.`
                                : c('Title').ngettext(msgid`${filesCount} file`, `${filesCount} files`, filesCount);
                        })()}
                    </div>
                </div>
                {!canUseStorage && (
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
                            title={c('Action').t`Remove all files`}
                            disabled={deleteDisabled || loading}
                        >
                            <Icon name="trash" alt={c('Action').t`Remove all files`} size={5} />
                        </Button>
                    </div>
                )}
            </div>
            {children}
            {deleteFile.state.open && (
                <ConfirmationPrompt
                    onCancel={deleteFile.abort}
                    onConfirm={deleteFile.resolver}
                    title={c('Action').t`Delete all files`}
                    message={c('Info').t`Do you want to remove all the files?`}
                />
            )}
        </div>
    );
};
