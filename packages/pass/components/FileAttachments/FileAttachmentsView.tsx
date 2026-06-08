import { type FC, type PropsWithChildren, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { useMemoSelector } from '@proton/pass/hooks/useMemoSelector';
import { isCustomIconFile } from '@proton/pass/lib/file-attachments/custom-icon';
import { hasAttachments } from '@proton/pass/lib/items/item.predicates';
import { filesResolve } from '@proton/pass/store/actions';
import { selectRequestInFlight } from '@proton/pass/store/selectors';
import { selectItemFilesForRevision } from '@proton/pass/store/selectors/files';
import type { ItemOptimisticState, ItemRevision } from '@proton/pass/types';

import { FileAttachmentsList } from './FileAttachmentsList';
import { FileAttachmentsSummary } from './FileAttachmentsSummary';

type FileAttachmentsViewProps = PropsWithChildren<{
    filesCount: number;
    disabled?: boolean;
    loading?: boolean;
}>;

export const FileAttachmentsView: FC<FileAttachmentsViewProps> = ({ children, filesCount, disabled, loading }) => (
    <FieldsetCluster mode="read" as="div" className="pass-value-control">
        <FileAttachmentsSummary filesCount={filesCount} deleteDisabled={disabled} loading={loading}>
            {children}
        </FileAttachmentsSummary>
    </FieldsetCluster>
);

export const FileAttachmentsContentView: FC<{ revision: ItemRevision<any> & Partial<ItemOptimisticState> }> = ({
    revision,
}) => {
    const { shareId, itemId, optimistic, failed } = revision;
    const allFiles = useMemoSelector(selectItemFilesForRevision, [shareId, itemId, revision.revision]);
    const loading = useSelector(selectRequestInFlight(filesResolve.requestID(revision))) || (optimistic && !failed);

    /** Filter out custom icon files — they are displayed as item icons */
    const files = useMemo(() => allFiles.filter((f) => !isCustomIconFile(f.name)), [allFiles]);
    const filesCount = files.length;

    return (
        (filesCount > 0 || hasAttachments(revision)) && (
            <FileAttachmentsView filesCount={filesCount} loading={loading}>
                <FileAttachmentsList shareId={shareId} itemId={itemId} files={files} />
            </FileAttachmentsView>
        )
    );
};
