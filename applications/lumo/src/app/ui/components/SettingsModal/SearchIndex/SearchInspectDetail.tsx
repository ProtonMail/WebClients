import { Button } from '@proton/atoms/Button/Button';
import { Icon } from '@proton/components';
import type { FunctionComponent } from 'react';

import { c } from 'ttag';

import type { DriveDocument } from '../../../../types/documents';
import { SearchInspectMeta } from './SearchInspectMeta';

interface Props {
    doc: DriveDocument;
    formatBytes: (bytes?: number) => string;
    onBack: () => void;
}

export const SearchInspectDetail: FunctionComponent<Props> = ({ doc, formatBytes, onBack }) => {
    const sizeText =
        doc.size && doc.size > 0
            ? formatBytes(doc.size)
            : doc.content
                ? formatBytes(new TextEncoder().encode(doc.content).byteLength)
                : c('Info').t`Unknown size`;
    const contentSizeText = doc.content ? formatBytes(new TextEncoder().encode(doc.content).byteLength) : undefined;

    return (
        <div className="w-full flex flex-column gap-3" style={{ maxWidth: '720px', margin: '0 auto' }}>
            <div className="flex items-center gap-2">
                <Button shape="ghost" size="small" onClick={onBack}>
                    <Icon name="arrow-left" size={4} className="mr-1" />
                    {c('Action').t`Back`}
                </Button>
                <span className="text-semibold truncate">{doc.name}</span>
            </div>

            <SearchInspectMeta
                doc={doc}
                sizeText={sizeText}
                contentSizeText={contentSizeText}
                className="w-full p-3 border rounded bg-weak"
            />

            {doc.content && (
                <div
                    className="w-full p-3 border rounded bg-weak"
                    style={{ borderColor: 'var(--border-weak)', maxHeight: 400, overflowY: 'auto' }}
                >
                    <div className="text-xs color-weak mb-2">{c('Info').t`Indexed content (first 2000 chars):`}</div>
                    <pre className="text-sm whitespace-pre-wrap break-words m-0" style={{ lineHeight: 1.4 }}>
                        {doc.content.slice(0, 2000)}
                        {doc.content.length > 2000 ? '…' : ''}
                    </pre>
                </div>
            )}
        </div>
    );
};


