import { useRef, useState, useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Icon, useNotifications } from '@proton/components';

import type { Attachment } from '../../types';
import { useLumoDispatch, useLumoSelector } from '../../redux/hooks';
import { selectAttachmentsBySpaceId, selectProvisionalAttachments } from '../../redux/selectors';
import { handleFileAsync } from '../../services/files/fileAsync';
import { pushAttachmentRequest, upsertAttachment, deleteAttachment } from '../../redux/slices/core/attachments';
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
    const [fileToView, setFileToView] = useState<Attachment | null>(null);
    const [pendingFileNames, setPendingFileNames] = useState<Set<string>>(new Set());

    // Get actual files from Space attachments
    const spaceAttachments = useLumoSelector((state) => selectAttachmentsBySpaceId(projectId)(state));
    const files = Object.values(spaceAttachments);
    
    // Get provisional attachments to find newly uploaded files
    const provisionalAttachments = useLumoSelector(selectProvisionalAttachments);

    // Watch for new provisional attachments and assign them to the space
    useEffect(() => {
        if (pendingFileNames.size === 0) return;

        provisionalAttachments.forEach((attachment) => {
            if (pendingFileNames.has(attachment.filename) && !attachment.spaceId) {
                console.log('Auto-assigning provisional attachment to space:', attachment.id, attachment.filename);
                dispatch(upsertAttachment({ ...attachment, spaceId: projectId }));
                dispatch(pushAttachmentRequest({ id: attachment.id }));
                
                // Remove from pending
                setPendingFileNames((prev) => {
                    const next = new Set(prev);
                    next.delete(attachment.filename);
                    return next;
                });
            }
        });
    }, [provisionalAttachments, pendingFileNames, projectId, dispatch]);

    const handleAddFiles = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(event.target.files || []);
        if (selectedFiles.length === 0) return;

        // Process each file
        for (const file of selectedFiles) {
            try {
                console.log('Processing file for project:', file.name);
                
                // Add to pending files - the useEffect will watch for it
                setPendingFileNames((prev) => new Set(prev).add(file.name));
                
                const result = await dispatch(handleFileAsync(file, []));

                if (result.success) {
                    createNotification({
                        text: c('collider_2025:Success').t`File "${file.name}" added to project`,
                        type: 'success',
                    });
                } else if (result.isDuplicate) {
                    // Remove from pending if duplicate
                    setPendingFileNames((prev) => {
                        const next = new Set(prev);
                        next.delete(file.name);
                        return next;
                    });
                    createNotification({
                        text: c('collider_2025:Info').t`File "${file.name}" is already attached`,
                        type: 'info',
                    });
                } else if (result.isUnsupported) {
                    // Remove from pending if unsupported
                    setPendingFileNames((prev) => {
                        const next = new Set(prev);
                        next.delete(file.name);
                        return next;
                    });
                    createNotification({
                        text: c('collider_2025:Error').t`File type not supported: ${file.name}`,
                        type: 'error',
                    });
                } else {
                    // Remove from pending on failure
                    setPendingFileNames((prev) => {
                        const next = new Set(prev);
                        next.delete(file.name);
                        return next;
                    });
                    createNotification({
                        text: c('collider_2025:Error').t`Failed to process file: ${file.name}`,
                        type: 'error',
                    });
                }
            } catch (error) {
                console.error('Error processing file:', error);
                // Remove from pending on error
                setPendingFileNames((prev) => {
                    const next = new Set(prev);
                    next.delete(file.name);
                    return next;
                });
                createNotification({
                    text: c('collider_2025:Error').t`Error processing file: ${file.name}`,
                    type: 'error',
                });
            }
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleViewFile = (attachment: Attachment) => {
        setFileToView(attachment);
    };

    const handleCloseFileView = () => {
        setFileToView(null);
    };

    const handleRemoveFile = (id: string) => {
        dispatch(deleteAttachment(id));
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
                                <Icon name="paperclip" size={6} />
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

