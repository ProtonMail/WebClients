import { c } from 'ttag';

import { FileIcon } from '@proton/components';
import { NodeType } from '@proton/drive/index';

import { FileName } from '../../components/FileName';
import { SignatureIcon } from '../../components/SignatureIcon';
import { SortField } from '../../hooks/util/useSorting';
import type { CellDefinition } from '../../statelessComponents/DriveExplorer/types';

export interface NameCellProps {
    uid: string;
    name: string;
    type: NodeType;
    mediaType?: string;
    thumbnail?: {
        sdUrl?: string;
    };
    haveSignatureIssues: boolean | undefined;
    isInvitation?: boolean;
}

export const NameCell = ({
    name,
    type,
    mediaType,
    thumbnail,
    isInvitation = false,
    haveSignatureIssues = false,
}: NameCellProps) => {
    return (
        <span className="flex items-center flex-nowrap mr-4" aria-label={name}>
            {thumbnail?.sdUrl ? (
                <img
                    src={thumbnail.sdUrl}
                    alt={name}
                    className="file-browser-list-item--thumbnail shrink-0 mr-2"
                    style={isInvitation ? { filter: 'grayscale(100%)' } : undefined}
                />
            ) : (
                <FileIcon
                    mimeType={((type === NodeType.File || type === NodeType.Photo) && mediaType) || 'Folder'}
                    alt={name}
                    className="file-browser-list-item--icon mr-2"
                    style={isInvitation ? { filter: 'grayscale(100%)' } : undefined}
                />
            )}
            <SignatureIcon
                haveSignatureIssues={haveSignatureIssues}
                isFile={type === NodeType.File || type === NodeType.Photo}
                className="mr-2 shrink-0"
            />
            <FileName text={name} testId="name-cell" />
        </span>
    );
};

export const defaultNameCellConfig: Omit<CellDefinition, 'render'> = {
    id: 'name',
    headerText: c('Label').t`Name`,
    className: 'flex items-center flex-1',
    sortField: SortField.name,
    testId: 'column-name',
};
