import { useState } from 'react';

import { Button } from '@proton/atoms/Button/Button';
import { Icon } from '@proton/components/index';
import FileIcon from '@proton/components/components/fileIcon/FileIcon';
import type { FunctionComponent } from 'react';

import { c } from 'ttag';

import type { GroupedDocument } from './SearchInspectList';

interface Props {
    grouped: GroupedDocument;
    formatBytes: (bytes?: number) => string;
    onBack: () => void;
}

export const SearchInspectDetail: FunctionComponent<Props> = ({ grouped, formatBytes, onBack }) => {
    const { doc, chunks, totalSize } = grouped;
    const hasChunks = chunks.length > 0;
    const [expandedChunk, setExpandedChunk] = useState<number | null>(null);

    const sizeText = formatBytes(totalSize);

    return (
        <div className="flex flex-column gap-4 flex-nowrap overflow-y-auto *:min-size-auto">
            <div className="flex items-center gap-2 mb-2">
                <Button shape="ghost" size="small" onClick={onBack}>
                    <Icon name="arrow-left" size={4} className="mr-1" />
                    {c('Action').t`Back`}
                </Button>
                <span className="text-semibold truncate">{doc.name}</span>
            </div>

            {/* Document metadata */}
            <div className="p-3 border rounded bg-weak" style={{ borderColor: 'var(--border-weak)' }}>
                <div className="flex items-start gap-3">
                    <FileIcon mimeType={doc.mimeType || 'application/octet-stream'} size={5} />
                    <div className="flex flex-column gap-1 flex-1 min-w-0">
                        <div className="text-semibold text-lg truncate">{doc.name}</div>
                        {doc.folderPath && (
                            <div className="text-sm color-weak">
                                <strong>{c('Info').t`Folder:`}</strong> {doc.folderPath}
                            </div>
                        )}
                        <div className="text-sm color-weak">
                            <strong>{c('Info').t`Size:`}</strong> {sizeText}
                        </div>
                        <div className="text-sm color-weak">
                            <strong>{c('Info').t`MIME:`}</strong> {doc.mimeType || c('Info').t`Unknown`}
                        </div>
                        {hasChunks && (
                            <div className="text-sm color-info">
                                <strong>{c('Info').t`Chunks:`}</strong> {chunks.length} {c('Info').t`searchable sections`}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Chunks list (if chunked) */}
            {hasChunks ? (
                <div className="flex flex-column gap-2">
                    <div className="text-sm text-semibold color-weak">
                        {c('Info').t`Searchable chunks`}
                    </div>
                    {chunks.map((chunk, index) => {
                        const isExpanded = expandedChunk === index;
                        const chunkSize = chunk.content ? new TextEncoder().encode(chunk.content).byteLength : 0;

                        return (
                            <div
                                key={chunk.id}
                                className="border rounded bg-weak"
                                style={{ borderColor: 'var(--border-weak)' }}
                            >
                                <button
                                    type="button"
                                    className="w-full p-3 text-left flex items-center gap-3 hover:bg-norm transition-colors"
                                    onClick={() => setExpandedChunk(isExpanded ? null : index)}
                                >
                                    <Icon
                                        name={isExpanded ? 'chevron-down' : 'chevron-right'}
                                        size={4}
                                        className="color-weak shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-semibold">
                                                {c('Info').t`Chunk`} {index + 1}/{chunks.length}
                                            </span>
                                            <span className="text-xs color-weak">
                                                {formatBytes(chunkSize)}
                                            </span>
                                        </div>
                                        {chunk.chunkTitle && (
                                            <div className="text-sm color-weak truncate">
                                                {chunk.chunkTitle}
                                            </div>
                                        )}
                                    </div>
                                </button>

                                {isExpanded && chunk.content && (
                                    <div
                                        className="p-3 border-top"
                                        style={{
                                            borderColor: 'var(--border-weak)',
                                            maxHeight: 300,
                                            overflowY: 'auto'
                                        }}
                                    >
                                        <pre className="text-sm whitespace-pre-wrap break-words m-0" style={{ lineHeight: 1.4 }}>
                                            {chunk.content.slice(0, 1500)}
                                            {chunk.content.length > 1500 ? '…' : ''}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* Non-chunked document content */
                doc.content && (
                    <div
                        className="p-3 border rounded bg-weak"
                        style={{ borderColor: 'var(--border-weak)', maxHeight: 400, overflowY: 'auto' }}
                    >
                        <div className="text-xs color-weak mb-2">{c('Info').t`Indexed content (first 2000 chars):`}</div>
                        <pre className="text-sm whitespace-pre-wrap break-words m-0" style={{ lineHeight: 1.4 }}>
                            {doc.content.slice(0, 2000)}
                            {doc.content.length > 2000 ? '…' : ''}
                        </pre>
                    </div>
                )
            )}
        </div>
    );
};


