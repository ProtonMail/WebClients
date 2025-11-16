import { useRef, useState, useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Icon, useNotifications } from '@proton/components';

import type { Asset } from '../../types';
import { useLumoDispatch, useLumoSelector } from '../../redux/hooks';
import { selectAssetsBySpaceId } from '../../redux/selectors';
import { handleSpaceAssetFileAsync } from '../../services/files';
import { locallyDeleteAssetFromLocalRequest } from '../../redux/slices/core/assets';
import { KnowledgeFileItem } from '../components/Files/KnowledgeBase/KnowledgeFileItem';
import { FileContentModal } from '../components/Files/KnowledgeBase/FileContentModal';

import './ProjectFilesPanel.scss';

interface ProjectFilesPanelProps {
    projectId: string;
    instructions?: string;
    onEditInstructions: () => void;
}

export const ProjectFilesPanel = ({ projectId, instructions, onEditInstructions }: ProjectFilesPanelProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dispatch = useLumoDispatch();
    const { createNotification } = useNotifications();
    const [fileToView, setFileToView] = useState<Asset | null>(null);

    // Get space assets (persistent files)
    const spaceAssets = useLumoSelector((state) => selectAssetsBySpaceId(projectId)(state));
    const files = Object.values(spaceAssets).filter((asset) => !asset.deleted && !asset.error);

    const handleAddFiles = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(event.target.files || []);
        if (selectedFiles.length === 0) return;

        // Process each file as a space asset
        for (const file of selectedFiles) {
            try {
                console.log('Processing file as space asset:', file.name, projectId);

                const result = await dispatch(handleSpaceAssetFileAsync(file, projectId));

                if (result.success) {
                    createNotification({
                        text: c('collider_2025:Success').t`File "${file.name}" added to project`,
                        type: 'success',
                    });
                } else if (result.isDuplicate) {
                    createNotification({
                        text: c('collider_2025:Info').t`File "${file.name}" is already in this project`,
                        type: 'info',
                    });
                } else if (result.isUnsupported) {
                    createNotification({
                        text: c('collider_2025:Error').t`File type not supported: ${file.name}`,
                        type: 'error',
                    });
                } else {
                    createNotification({
                        text: c('collider_2025:Error').t`Failed to process file: ${file.name}`,
                        type: 'error',
                    });
                }
            } catch (error) {
                console.error('Error uploading file:', error);
                createNotification({
                    text: c('collider_2025:Error').t`Error uploading file: ${file.name}`,
                    type: 'error',
                });
            }
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleViewFile = (asset: Asset) => {
        setFileToView(asset);
    };

    const handleCloseFileView = () => {
        setFileToView(null);
    };

    const handleRemoveFile = (id: string) => {
        dispatch(locallyDeleteAssetFromLocalRequest(id));
        createNotification({
            text: c('collider_2025:Success').t`File removed from project`,
            type: 'success',
        });
    };

    return (
        <div className="project-files-panel">
            {/* Instructions Section */}
            <div className="project-files-section">
                <div className="project-files-section-header">
                    <h3 className="project-files-section-title">{c('collider_2025:Title').t`Instructions`}</h3>
                    <Button
                        icon
                        shape="ghost"
                        size="small"
                        onClick={onEditInstructions}
                        title={c('collider_2025:Action').t`Edit instructions`}
                    >
                        <Icon name="pen" size={4} />
                    </Button>
                </div>
                <div className="project-files-section-content">
                    {instructions ? (
                        <p className="project-instructions-text">{instructions}</p>
                    ) : (
                        <button className="project-instructions-add" onClick={onEditInstructions}>
                            <Icon name="plus" size={4} />
                            <span>{c('collider_2025:Button').t`Add instructions to tailor Lumo's responses`}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Files Section */}
            <div className="project-files-section">
                <div className="project-files-section-header">
                    <h3 className="project-files-section-title">{c('collider_2025:Title').t`Files`}</h3>
                    <Button
                        icon
                        shape="ghost"
                        size="small"
                        onClick={handleAddFiles}
                        title={c('collider_2025:Action').t`Add files`}
                    >
                        <Icon name="plus" size={4} />
                    </Button>
                </div>
                <div className="project-files-section-content">
                    {files.length === 0 ? (
                        <div className="project-files-empty">
                            <button className="project-files-add" onClick={handleAddFiles}>
                                <Icon name="paper-clip" size={6} />
                                <span className="project-files-add-text">
                                    {c('collider_2025:Button').t`Add files`}
                                </span>
                                <span className="project-files-add-hint">
                                    {c('collider_2025:Info').t`Attach files that will be available in all chats`}
                                </span>
                            </button>
                        </div>
                    ) : (
                        <div className="project-files-list">
                            {files.map((file) => (
                                <KnowledgeFileItem
                                    key={file.id}
                                    file={file}
                                    onView={(file, fullAttachment) => handleViewFile(fullAttachment)}
                                    onRemove={handleRemoveFile}
                                    isActive={true}
                                    showToggle={false}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                style={{ display: 'none' }}
                accept="*/*"
            />

            {/* File preview modal */}
            {fileToView && (
                <FileContentModal attachment={fileToView} onClose={handleCloseFileView} open={!!fileToView} />
            )}
        </div>
    );
};

