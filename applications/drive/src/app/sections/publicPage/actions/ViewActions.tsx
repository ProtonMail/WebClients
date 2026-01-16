import { ContextSeparator } from '@proton/components/index';

import { DetailsButton } from '../../commonButtons/DetailsButton';
import { DownloadButton } from '../../commonButtons/DownloadButton';
import { PreviewButton } from '../../commonButtons/PreviewButton';
import type { PublicItemChecker } from './actionsItemsChecker';

interface BaseViewActionsProps {
    itemChecker: PublicItemChecker;
    selectedUids: string[];
    onPreview: (uid: string) => void;
    onDownload: (uids: string[]) => void;
    onDetails: (uid: string) => void;
}

interface ContextMenuViewActionsProps extends BaseViewActionsProps {
    buttonType: 'contextMenu';
    close: () => void;
}

interface ToolbarViewActionsProps extends BaseViewActionsProps {
    buttonType: 'toolbar';
    close?: never;
}

type ViewActionsProps = ContextMenuViewActionsProps | ToolbarViewActionsProps;

export function ViewActions({
    itemChecker,
    selectedUids,
    onPreview,
    onDownload,
    onDetails,
    close,
    buttonType,
}: ViewActionsProps) {
    const firstItemUid = selectedUids.at(0);

    return (
        <>
            {itemChecker.hasPreviewAvailable && itemChecker.isSingleSelection && firstItemUid && (
                <>
                    <PreviewButton
                        onClick={() => onPreview(firstItemUid)}
                        {...(buttonType === 'contextMenu' ? { close, buttonType } : { buttonType })}
                    />
                    <ContextSeparator />
                </>
            )}
            <DownloadButton
                onClick={() => onDownload(selectedUids)}
                {...(buttonType === 'contextMenu' ? { close, buttonType } : { buttonType })}
            />

            {itemChecker.isSingleSelection && firstItemUid && (
                <>
                    <ContextSeparator />
                    <DetailsButton
                        onClick={() => onDetails(firstItemUid)}
                        {...(buttonType === 'contextMenu' ? { close, buttonType } : { buttonType })}
                    />
                </>
            )}
        </>
    );
}
