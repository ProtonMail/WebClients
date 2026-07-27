import { c } from 'ttag';

import { FileIcon, MiddleEllipsis } from '@proton/components';
import { NodeType } from '@proton/drive';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { splitExtension } from '@proton/shared/lib/helpers/file';
import { rtlSanitize } from '@proton/shared/lib/helpers/string';

import { nodeTypeComparator, stringComparator } from '../../modules/sorting/comparators';
import { SortField } from '../../modules/sorting/types';
import type { CellDefinitionConfig } from '../../statelessComponents/DriveExplorer/types';
import { SignatureIcon } from '../../statelessComponents/SignatureIcon';

export interface NameCellProps {
    uid: string;
    name: string;
    type: NodeType;
    mediaType?: string;
    thumbnailUrl?: string;
    haveSignatureIssues: boolean | undefined;
    isInvitation?: boolean;
}

const CHARACTERS_BEFORE_EXTENSION = 1; // The dot before the extension

export const NameCell = ({
    name,
    type,
    mediaType,
    thumbnailUrl,
    isInvitation = false,
    haveSignatureIssues = false,
}: NameCellProps) => {
    const sanitized = rtlSanitize(name);
    const isFile = type === NodeType.File || type === NodeType.Photo;
    const [, extension] = isFile ? splitExtension(sanitized) : ['', ''];

    const hasExtension = extension.length > 0;
    const charsToDisplayEnd = hasExtension ? extension.length + CHARACTERS_BEFORE_EXTENSION : 0;
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
                (thumbnailUrl ? (
                    <img
                        src={thumbnailUrl}
                        alt={name}
                        className="file-browser-list-item--thumbnail shrink-0 mr-2"
                        style={isInvitation ? { filter: 'grayscale(100%)' } : undefined}
                    />
                ) : (
                    <FileIcon
                        mimeType={type === NodeType.File || type === NodeType.Photo ? mediaType || '' : 'Folder'}
                        alt={name}
                        className="file-browser-list-item--icon mr-2"
                        style={isInvitation ? { filter: 'grayscale(100%)' } : undefined}
                    />
                ))}
            <SignatureIcon haveSignatureIssues={haveSignatureIssues} type={type} className="mr-2 shrink-0" />
            <MiddleEllipsis
                charsToDisplayEnd={charsToDisplayEnd}
                text={sanitized}
                displayTitle={false}
                displayTooltip
                data-testid={'name-cell'}
                splitOnlyTooLong
            />
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
