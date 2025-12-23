import { c } from 'ttag';

import { FileIcon } from '@proton/components';
import { NodeType } from '@proton/drive';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import { FileName } from '../../components/FileName';
import { SignatureIcon } from '../../components/SignatureIcon';
import { nodeTypeComparator, stringComparator } from '../../modules/sorting/comparators';
import { SortField } from '../../modules/sorting/types';
import type { CellDefinitionConfig } from '../../statelessComponents/DriveExplorer/types';

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
            {type === NodeType.Album && (
                <FileIcon
                    mimeType="Album"
                    alt={c('Label').t`Album`}
                    className="file-browser-list-item--icon mr-2"
                    // TODO: Create a proper scss file for this cell
                    style={isInvitation ? { filter: 'grayscale(100%)' } : undefined}
                />
            )}
            {type !== NodeType.Album &&
                (thumbnail?.sdUrl ? (
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
                ))}
            <SignatureIcon
                haveSignatureIssues={haveSignatureIssues}
                isFile={type === NodeType.File || type === NodeType.Photo}
                className="mr-2 shrink-0"
            />
            <FileName text={name} testId="name-cell" />
        </span>
    );
};

export const defaultNameCellConfig: CellDefinitionConfig = {
    id: 'name',
    headerText: c('Label').t`Name`,
    className: 'flex-1',
    sortField: SortField.name,
    sortConfig: [
        { field: SortField.nodeType, comparator: nodeTypeComparator, direction: SORT_DIRECTION.ASC },
        { field: SortField.name, comparator: stringComparator },
    ],
    testId: 'column-name',
};
