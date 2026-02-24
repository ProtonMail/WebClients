import { useMemo } from 'react';

import { Button } from '@proton/atoms/Button/Button';
import { Icon } from '@proton/components/index';
import FileIcon from '@proton/components/components/fileIcon/FileIcon';
import type { FunctionComponent } from 'react';

import { c } from 'ttag';

import type { DriveDocument } from '../../../../types/documents';

/** A grouped document with all its chunks */
export interface GroupedDocument {
    /** The parent document (or first chunk as representative) */
    doc: DriveDocument;
    /** All chunks for this document (empty if not chunked) */
    chunks: DriveDocument[];
    /** Total size of all chunks */
    totalSize: number;
}

interface Props {
    displayDriveDocs: number;
    docs: DriveDocument[];
    formatBytes: (bytes?: number) => string;
    onBack: () => void;
    onSelect: (grouped: GroupedDocument) => void;
}

export const SearchInspectList: FunctionComponent<Props> = ({ displayDriveDocs, docs, formatBytes, onBack, onSelect }) => {
    // Group documents by parent ID (chunks) or by their own ID (non-chunks)
    const groupedDocs = useMemo(() => {
        const groups = new Map<string, GroupedDocument>();

        for (const doc of docs) {
            const parentId = doc.parentDocumentId || doc.id;

            if (!groups.has(parentId)) {
                groups.set(parentId, {
                    doc: doc.isChunk ? { ...doc, id: parentId } : doc,
                    chunks: [],
                    totalSize: 0,
                });
            }

            const group = groups.get(parentId)!;
            if (doc.isChunk) {
                group.chunks.push(doc);
                // Sort chunks by index
                group.chunks.sort((a, b) => (a.chunkIndex || 0) - (b.chunkIndex || 0));
            }

            // Add to total size
            const docSize = doc.content ? new TextEncoder().encode(doc.content).byteLength : (doc.size || 0);
            group.totalSize += docSize;
        }

        return Array.from(groups.values());
    }, [docs]);

    return (
        <div className="flex flex-column gap-4 flex-nowrap overflow-y-auto *:min-size-auto">
            <div className="flex items-center gap-2 mb-2">
                <Button shape="ghost" size="small" onClick={onBack}>
                    <Icon name="arrow-left" size={4} className="mr-1" />
                    {c('Action').t`Back to search settings`}
                </Button>
                <span className="text-semibold">{c('Title').t`Indexed Drive documents`}</span>
            </div>
            {groupedDocs.length === 0 ? (
                <div className="p-4 color-weak bg-weak rounded">
                    <div className="mb-2">{c('Info').t`No Drive documents are loaded for inspection in this session.`}</div>
                    {displayDriveDocs > 0 ? (
                        <div className="text-sm">
                            {c('Info').t`The index reports ${displayDriveDocs} Drive documents. Re-index or keep the session open after indexing to view details here.`}
                        </div>
                    ) : null}
                </div>
            ) : (
                <div className="flex flex-column gap-2">
                    {groupedDocs.map((grouped) => {
                        const { doc, chunks, totalSize } = grouped;
                        const hasChunks = chunks.length > 0;
                        const sizeText = formatBytes(totalSize);

                        return (
                            <button
                                key={doc.parentDocumentId || doc.id}
                                type="button"
                                className="w-full p-3 border rounded bg-weak text-left hover:border-primary transition-colors"
                                style={{ borderColor: 'var(--border-weak)' }}
                                onClick={() => onSelect(grouped)}
                            >
                                <div className="flex items-start gap-3">
                                    <FileIcon mimeType={doc.mimeType || 'application/octet-stream'} size={4} />
                                    <div className="flex flex-column gap-1 flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-semibold truncate">{doc.name}</span>
                                            {hasChunks && (
                                                <span className="text-xs px-2 py-0.5 rounded bg-info color-invert shrink-0">
                                                    {chunks.length} {c('Info').t`chunks`}
                                                </span>
                                            )}
                                        </div>
                                        {doc.folderPath && (
                                            <div className="text-sm color-weak truncate">
                                                {doc.folderPath}
                                            </div>
                                        )}
                                        <div className="text-sm color-weak">
                                            {sizeText}
                                        </div>
                                    </div>
                                    <Icon name="chevron-right" size={4} className="color-weak shrink-0 my-auto" />
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};


