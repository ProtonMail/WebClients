import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import {
    Icon,
    InputFieldTwo,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    Option,
    SelectTwo,
    TextAreaTwo,
} from '@proton/components';
import type { ModalStateProps } from '@proton/components';

import { PROJECT_CATEGORIES } from '../constants';
import { useProjectActions } from '../hooks/useProjectActions';

import './NewProjectModal.scss';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

interface NewProjectModalProps extends ModalStateProps {
    onProjectCreated?: (projectId: string) => void;
    initialName?: string;
    initialInstructions?: string;
    initialIcon?: string;
}

export const NewProjectModal = ({ 
    onProjectCreated, 
    initialName,
    initialInstructions,
    initialIcon,
    ...modalProps 
}: NewProjectModalProps) => {
    const [projectName, setProjectName] = useState('');
    const [projectInstructions, setProjectInstructions] = useState('');
    const [selectedIcon, setSelectedIcon] = useState<string>('other');
    const { createProject } = useProjectActions();

    // Populate initial values when modal opens
    useEffect(() => {
        if (modalProps.open) {
            setProjectName(initialName || '');
            setProjectInstructions(initialInstructions || '');
            setSelectedIcon(initialIcon || 'other');
        }
    }, [modalProps.open, initialName, initialInstructions, initialIcon]);

    const handleCancel = () => {
        setProjectName('');
        setProjectInstructions('');
        setSelectedIcon('other');
        modalProps.onClose?.();
    };

    const handleCreateProject = async () => {
        try {
            const { spaceId } = await createProject(projectName, projectInstructions, [], selectedIcon);

            // Close modal and call callback
            handleCancel();
            onProjectCreated?.(spaceId);
        } catch (error) {
            console.error('Error creating project:', error);
            // TODO: Show error notification
        }
    };

    const isCreateDisabled = !projectName.trim();

    return (
        <>
            <ModalTwo {...modalProps} onClose={handleCancel} size="large">
                <ModalTwoHeader title={c('collider_2025:Title').t`New Project`} subline={c('collider_2025:Subline').t`Projects keep chats, files, and custom instructions in one place. Use them for ongoing work, or just to keep things tidy.`}/>
                
                <ModalTwoContent>
                    <div className="new-project-modal-content">
                        {/* Category selection */}
                        <div className="mt-4 mb-4">
                            <label htmlFor="project-category" className="label text-bold">
                                {c('collider_2025:Label').t`Category`}
                            </label>
                            <SelectTwo
                                id="project-category"
                                value={selectedIcon}
                                className="mt-2"
                                onValue={(value: string) => setSelectedIcon(value)}
                            >
                                {PROJECT_CATEGORIES.map((category) => (
                                    <Option key={category.id} value={category.id} title={category.name}>
                                        <div className="new-project-modal-category-option">
                                            <div
                                                className="new-project-modal-category-icon"
                                                style={{ backgroundColor: category.color }}
                                            >
                                                <Icon name={category.icon as any} size={4} className="color-white" />
                                            </div>
                                            <span>{category.name}</span>
                                        </div>
                                    </Option>
                                ))}
                            </SelectTwo>
                        </div>

                        <InputFieldTwo
                            id="project-name"
                            label={c('collider_2025:Label').t`Project name`}
                            placeholder={c('collider_2025:Placeholder').t`Enter project name`}
                            value={projectName}
                            onValue={setProjectName}
                            autoFocus
                            maxLength={100}
                        />
                        
                        <div className="mt-1">
                            <label htmlFor="project-instructions" className="label">
                                {c('collider_2025:Label').t`Project Instructions (optional)`}
                            </label>
                            <TextAreaTwo
                                id="project-instructions"
                                placeholder={c('collider_2025:Placeholder').t`Add instructions about the tone, style, and persona you want ${LUMO_SHORT_APP_NAME} to adopt.`}
                                value={projectInstructions}
                                onValue={setProjectInstructions}
                                rows={5}
                            />
                        </div>
                    </div>
                </ModalTwoContent>
                <ModalTwoFooter>
                    <Button onClick={handleCancel} color="weak">
                        {c('collider_2025:Button').t`Cancel`}
                    </Button>
                    <Button onClick={handleCreateProject} color="norm" disabled={isCreateDisabled}>
                        {c('collider_2025:Button').t`Create project`}
                    </Button>
                </ModalTwoFooter>
            </ModalTwo>
        </>
    );
};

