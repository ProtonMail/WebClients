import { c } from 'ttag';

import { FileIcon, TableCell } from '@proton/components';
import { NodeType } from '@proton/drive/index';

import { FileName } from '../FileName';
import { SignatureIcon } from '../SignatureIcon';
import { getLinkIconText } from '../sections/FileBrowser/utils';

interface NameCellProps {
    name: string;
    mediaType?: string;
    type: NodeType;
    thumbnailUrl?: string;
    isInvitation?: boolean;
    haveSignatureIssues: boolean | undefined;
}

export const NameCell = ({ name, mediaType, type, thumbnailUrl, isInvitation, haveSignatureIssues }: NameCellProps) => {
    const isAlbum = type === NodeType.Album;
    const isFile = type === NodeType.File;
    //TODO: Move that out of sections with FileBrowser refactor
    const iconText = getLinkIconText({
        linkName: name,
        mimeType: mediaType || '',
        isFile,
    });

    return (
        <TableCell className="m-0 flex items-center flex-nowrap flex-1" data-testid="column-name">
            {isAlbum && (
                <FileIcon
                    mimeType="Album"
                    alt={c('Label').t`Album`}
                    className="file-browser-list-item--icon mr-2"
                    // TODO: Create a proper scss file for this cell
                    style={isInvitation ? { filter: 'grayscale(100%)' } : undefined}
                />
            )}
            {thumbnailUrl && !isAlbum && (
                <img src={thumbnailUrl} alt={iconText} className="file-browser-list-item--thumbnail shrink-0 mr-2" />
            )}
            {!thumbnailUrl && !isAlbum && (
                <FileIcon
                    mimeType={isFile && mediaType ? mediaType : 'Folder'}
                    alt={iconText}
                    className="file-browser-list-item--icon mr-2"
                    // TODO: Create a proper scss file for this cell
                    style={isInvitation ? { filter: 'grayscale(100%)' } : undefined}
                />
            )}
            {haveSignatureIssues !== undefined && (
                <SignatureIcon haveSignatureIssues={haveSignatureIssues} isFile={isFile} className="mr-2 shrink-0" />
            )}
            <div className="flex mr-4" data-testid="name-cell">
                <FileName text={name} />
            </div>
        </TableCell>
    );
};
