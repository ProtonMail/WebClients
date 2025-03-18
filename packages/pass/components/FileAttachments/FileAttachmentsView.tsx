import type { FC, PropsWithChildren } from 'react';
import { useSelector } from 'react-redux';

import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { useMemoSelector } from '@proton/pass/hooks/useMemoSelector';
import { hasAttachments } from '@proton/pass/lib/items/item.predicates';
import { filesResolve } from '@proton/pass/store/actions';
import { selectRequestInFlight } from '@proton/pass/store/selectors';
import { selectItemFilesCount, selectItemFilesForRevision } from '@proton/pass/store/selectors/files';
import type { ItemRevision } from '@proton/pass/types';

import { FileAttachmentsList } from './FileAttachmentsList';
import { FileAttachmentsSummary } from './FileAttachmentsSummary';

type FileAttachmentsViewProps = PropsWithChildren<{
    filesCount: number;
    disabled?: boolean;
    loading?: boolean;
}>;

export const FileAttachmentsView: FC<FileAttachmentsViewProps> = ({ children, filesCount, disabled, loading }) => (
    <FieldsetCluster mode="read" as="div" className="pass-value-control">
        <FileAttachmentsSummary filesCount={filesCount} disabled={disabled} loading={loading}>
            {children}
        </FileAttachmentsSummary>
    </FieldsetCluster>
);

export const FileAttachmentsContentView: FC<{ revision: ItemRevision }> = ({ revision }) => {
    const { shareId, itemId } = revision;
    const filesCount = useMemoSelector(selectItemFilesCount, [shareId, itemId]);
    const files = useMemoSelector(selectItemFilesForRevision, [shareId, itemId, revision.revision]);
    const loading = useSelector(selectRequestInFlight(filesResolve.requestID(revision))) && !filesCount;

    return (
        hasAttachments(revision) && (
            <FileAttachmentsView filesCount={filesCount} loading={loading}>
                <FileAttachmentsList shareId={shareId} itemId={itemId} files={files} />
            </FileAttachmentsView>
        )
    );
};
