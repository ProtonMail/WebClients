import type { FC, PropsWithChildren } from 'react';
import { useSelector } from 'react-redux';

import { useMemoSelector } from '../../hooks/useMemoSelector';
import { hasAttachments } from '../../lib/items/item.predicates';
import { filesResolve } from '../../store/actions';
import { selectRequestInFlight } from '../../store/selectors';
import { selectItemFilesForRevision } from '../../store/selectors/files';
import type { ItemOptimisticState, ItemRevision } from '../../types';
import { FieldsetCluster } from '../Form/Field/Layout/FieldsetCluster';
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
    const files = useMemoSelector(selectItemFilesForRevision, [shareId, itemId, revision.revision]);
    const loading = useSelector(selectRequestInFlight(filesResolve.requestID(revision))) || (optimistic && !failed);
    const filesCount = files.length;

    return (
        (filesCount > 0 || hasAttachments(revision)) && (
            <FileAttachmentsView filesCount={filesCount} loading={loading}>
                <FileAttachmentsList shareId={shareId} itemId={itemId} files={files} />
            </FileAttachmentsView>
        )
    );
};
