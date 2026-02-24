import React from 'react';

import { Icon } from '@proton/components';
import FileIcon from '@proton/components/components/fileIcon/FileIcon';
import { IcBrandProtonDrive } from '@proton/icons/icons/IcBrandProtonDrive';

import { getMimeTypeFromExtension } from '../../util/filetypes';
import type { FileItem, FileMentionState } from './hooks/useFileMentionAutocomplete';

interface FileMentionComponentProps {
    mentionState: FileMentionState;
    files: FileItem[];
    selectedIndex: number;
    setSelectedIndex: (index: number) => void;
    selectFile: (file: FileItem) => void;
}

const highlightText = (text: string, query: string): { text: string; isMatch: boolean }[] => {
    if (!query) return [{ text, isMatch: false }];

    const parts: { text: string; isMatch: boolean }[] = [];
    let lastIndex = 0;
    let searchIndex = 0;

    while (true) {
        const matchIndex = text.toLowerCase().indexOf(query, searchIndex);
        if (matchIndex === -1) {
            if (lastIndex < text.length) {
                parts.push({ text: text.slice(lastIndex), isMatch: false });
            }
            break;
        }

        if (matchIndex > lastIndex) {
            parts.push({ text: text.slice(lastIndex, matchIndex), isMatch: false });
        }

        parts.push({ text: text.slice(matchIndex, matchIndex + query.length), isMatch: true });

        lastIndex = matchIndex + query.length;
        searchIndex = matchIndex + 1;
    }

    return parts.length > 0 ? parts : [{ text, isMatch: false }];
};

export const FileMentionComponent: React.FC<FileMentionComponentProps> = ({
    mentionState,
    files,
    selectedIndex,
    setSelectedIndex,
    selectFile,
}) => {
    if (!mentionState.isActive || !mentionState.position || files.length === 0) {
        return null;
    }

    // Calculate dropdown height and check if it would overflow the viewport
    const maxDropdownHeight = 320; // max-h-80 = 320px
    const estimatedItemHeight = 56; // Approximate height per item
    const estimatedHeight = Math.min(files.length * estimatedItemHeight + 8, maxDropdownHeight);
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    const bottomMargin = 16;

    // Position above if dropdown would overflow bottom of viewport
    const wouldOverflow = mentionState.position.top + estimatedHeight + bottomMargin > viewportHeight;
    const topPosition = wouldOverflow
        ? Math.max(8, mentionState.position.top - estimatedHeight - 8)
        : mentionState.position.top;

    return (
        <div
            className="file-mention-autocomplete fixed bg-norm border border-weak rounded-lg shadow-lifted z-[60] overflow-y-auto min-w-72 py-1"
            style={{
                top: `${topPosition}px`,
                left: `${mentionState.position.left}px`,
                maxWidth: `min(calc(100vw - ${mentionState.position.left + 16}px), 24rem)`,
                maxHeight: `${maxDropdownHeight}px`,
            }}
        >
            {files.map((file, index) => {
                const mimeType = file.mimeType || (file.source === 'drive' ? getMimeTypeFromExtension(file.name) : undefined);
                const query = mentionState.query.toLowerCase();
                const fullPath = file.name;

                const lastSlashIndex = fullPath.lastIndexOf('/');
                const folderPath = lastSlashIndex > 0 ? fullPath.substring(0, lastSlashIndex) : '';
                const fileName = lastSlashIndex > 0 ? fullPath.substring(lastSlashIndex + 1) : fullPath;

                const highlightedFileNameParts = highlightText(fileName, query);
                const highlightedFolderParts = folderPath ? highlightText(folderPath, query) : [];

                return (
                    <button
                        key={`${file.source}-${file.id}`}
                        type="button"
                        className={`w-full text-left px-4 py-3 hover:bg-weak transition-colors flex items-center gap-3 ${
                            index === selectedIndex ? 'bg-weak' : ''
                        }`}
                        onClick={() => selectFile(file)}
                        onMouseEnter={() => setSelectedIndex(index)}
                    >
                        {mimeType ? (
                            <FileIcon mimeType={mimeType} className="shrink-0" size={3.5} />
                        ) : (
                            <Icon name="file-lines" size={3.5} className="color-weak shrink-0" />
                        )}
                        <div className="flex-1 min-w-0 overflow-hidden">
                            {folderPath && (
                                <div className="text-xs color-weak whitespace-nowrap overflow-hidden text-ellipsis mb-0.5">
                                    {highlightedFolderParts.map((part, partIndex) => (
                                        <span
                                            key={partIndex}
                                            className={part.isMatch ? 'font-medium color-primary' : ''}
                                        >
                                            {part.text}
                                        </span>
                                    ))}
                                </div>
                            )}
                            <div className="text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                                {highlightedFileNameParts.map((part, partIndex) => (
                                    <span
                                        key={partIndex}
                                        className={part.isMatch ? 'font-semibold color-primary' : ''}
                                    >
                                        {part.text}
                                    </span>
                                ))}
                            </div>
                        </div>
                        {file.source === 'drive' && (
                            <IcBrandProtonDrive size={3} className="color-primary shrink-0 opacity-70 ml-1" />
                        )}
                    </button>
                );
            })}
        </div>
    );
};
