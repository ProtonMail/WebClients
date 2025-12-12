import { Button } from '@proton/atoms/Button/Button';
import { Icon } from '@proton/components';
import type { FunctionComponent } from 'react';

import { c } from 'ttag';

import type { DriveDocument } from '../../../../types/documents';
import { SearchInspectMeta } from './SearchInspectMeta';

interface Props {
    displayDriveDocs: number;
    docs: DriveDocument[];
    formatBytes: (bytes?: number) => string;
    onBack: () => void;
    onSelect: (doc: DriveDocument) => void;
}

export const SearchInspectList: FunctionComponent<Props> = ({ displayDriveDocs, docs, formatBytes, onBack, onSelect }) => (
    <div className="w-full flex flex-row gap-3" style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div className="flex items-center gap-2">
            <Button shape="ghost" size="small" onClick={onBack}>
                <Icon name="arrow-left" size={4} className="mr-1" />
                {c('Action').t`Back to search settings`}
            </Button>
            <span className="text-semibold">{c('Title').t`Indexed Drive documents`}</span>
        </div>
        {docs.length === 0 ? (
            <div className="p-4 color-weak bg-weak rounded">
                <div className="mb-2">{c('Info').t`No Drive documents are loaded for inspection in this session.`}</div>
                {displayDriveDocs > 0 ? (
                    <div className="text-sm">
                        {c('Info').t`The index reports ${displayDriveDocs} Drive documents. Re-index or keep the session open after indexing to view details here.`}
                    </div>
                ) : null}
            </div>
        ) : (
            <div className="flex flex-column gap-3 w-full">
                {docs.map((doc) => {
                    const sizeText =
                        doc.size && doc.size > 0
                            ? formatBytes(doc.size)
                            : doc.content
                                ? formatBytes(new TextEncoder().encode(doc.content).byteLength)
                                : c('Info').t`Unknown size`;
                    const contentSizeText = doc.content
                        ? formatBytes(new TextEncoder().encode(doc.content).byteLength)
                        : undefined;
                    return (
                        <button
                            key={doc.id}
                            type="button"
                            className="w-full p-3 border rounded bg-weak text-left hover:border-primary transition-colors"
                            style={{ borderColor: 'var(--border-weak)' }}
                            onClick={() => onSelect(doc)}
                        >
                            <SearchInspectMeta doc={doc} sizeText={sizeText} contentSizeText={contentSizeText} />
                        </button>
                    );
                })}
            </div>
        )}
    </div>
);


