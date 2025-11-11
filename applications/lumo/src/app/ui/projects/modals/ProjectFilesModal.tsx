import { useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Icon, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import type { ModalStateProps } from '@proton/components/components/modalTwo/interface';
import clsx from '@proton/utils/clsx';

import './ProjectFilesModal.scss';

interface ProjectFilesModalProps extends ModalStateProps {
    projectName: string;
    onCreateProject: (files?: File[]) => void;
    onBack: () => void;
}

export const ProjectFilesModal = ({ projectName, onCreateProject, onBack, ...modalProps }: ProjectFilesModalProps) => {
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAttachClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        if (files.length > 0) {
            setAttachedFiles((prev) => [...prev, ...files]);
        }
        // Reset input so same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveFile = (index: number) => {
        setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleDone = () => {
        onCreateProject(attachedFiles.length > 0 ? attachedFiles : undefined);
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <ModalTwo {...modalProps} size="small">
            <ModalTwoHeader title={c('collider_2025:Title').t`Project Files`} />
            <ModalTwoContent>
                <div className="project-files-modal-content">
                    {attachedFiles.length === 0 ? (
                        <div className="project-files-empty-state">
                            <div className="project-files-empty-icon">
                                <Icon name="folder" size={12} />
                            </div>
                            <h3 className="project-files-empty-title">
                                {c('collider_2025:Title').t`Add Project Files`}
                            </h3>
                            <p className="project-files-empty-description">
                                {c('collider_2025:Info').t`Start by attaching files to your project. They will be used in all chats in this project.`}
                            </p>
                            <Button
                                color="norm"
                                shape="outline"
                                onClick={handleAttachClick}
                                className="mt-4"
                            >
                                <Icon name="paperclip" className="mr-2" />
                                {c('collider_2025:Button').t`Attach`}
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="project-files-list">
                                {attachedFiles.map((file, index) => (
                                    <div key={`${file.name}-${index}`} className="project-file-item">
                                        <div className="project-file-icon">
                                            <Icon name="file" size={4} />
                                        </div>
                                        <div className="project-file-info">
                                            <span className="project-file-name">{file.name}</span>
                                            <span className="project-file-size">{formatFileSize(file.size)}</span>
                                        </div>
                                        <button
                                            className="project-file-remove"
                                            onClick={() => handleRemoveFile(index)}
                                            aria-label={c('collider_2025:Action').t`Remove file`}
                                        >
                                            <Icon name="cross" size={4} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <Button
                                color="weak"
                                shape="ghost"
                                onClick={handleAttachClick}
                                className="w-full mt-2"
                            >
                                <Icon name="paperclip" className="mr-2" />
                                {c('collider_2025:Button').t`Add more files`}
                            </Button>
                        </>
                    )}
                    
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        accept="*/*"
                    />
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onBack} color="weak">
                    {c('collider_2025:Button').t`Back`}
                </Button>
                <Button onClick={handleDone} color="norm">
                    {c('collider_2025:Button').t`Done`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

