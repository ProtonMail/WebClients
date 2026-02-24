import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { InputFieldTwo, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader, TextAreaTwo } from '@proton/components';
import type { ModalStateProps } from '@proton/components';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { IconPicker } from '../components/IconPicker';
import { DEFAULT_PROJECT_ICON, getIconFromProjectName } from '../constants';
import { useProjectActions } from '../hooks/useProjectActions';

import './NewProjectModal.scss';

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
    const [selectedIcon, setSelectedIcon] = useState<string>(DEFAULT_PROJECT_ICON);
    const [userSelectedIcon, setUserSelectedIcon] = useState(false);
    const { createProject } = useProjectActions();

    // Populate initial values when modal opens
    useEffect(() => {
        if (modalProps.open) {
            setProjectName(initialName || '');
            setProjectInstructions(initialInstructions || '');
            setSelectedIcon(initialIcon || DEFAULT_PROJECT_ICON);
            setUserSelectedIcon(!!initialIcon);
        }
    }, [modalProps.open, initialName, initialInstructions, initialIcon]);

    // Auto-suggest icon based on project name (only if user hasn't manually selected)
    useEffect(() => {
        if (!userSelectedIcon && projectName.trim()) {
            const suggestedIcon = getIconFromProjectName(projectName);
            setSelectedIcon(suggestedIcon);
        }
    }, [projectName, userSelectedIcon]);

    const handleIconSelect = (icon: string) => {
        setSelectedIcon(icon);
        setUserSelectedIcon(true);
    };

    const handleCancel = () => {
        setProjectName('');
        setProjectInstructions('');
        setSelectedIcon(DEFAULT_PROJECT_ICON);
        setUserSelectedIcon(false);
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
                <ModalTwoHeader title={c('collider_2025:Title').t`Create new project`} subline={c('collider_2025:Subline').t`Projects help you keep related chats, files, and instructions in one place. They make it easy to stay organized and reuse context across chats.`}/>
                
                <ModalTwoContent>
                    <div className="flex flex-column gap-4">
                        {/* Project name with icon picker */}
                        <div className="flex flex-nowrap items-center border border-weak rounded-lg p-1">
                            <IconPicker selectedIcon={selectedIcon} onSelectIcon={handleIconSelect} />
                            <InputFieldTwo
                                id="project-name"
                                placeholder={c('collider_2025:Placeholder').t`Holiday planner`}
                                value={projectName}
                                onValue={setProjectName}
                                autoFocus={false}
                                maxLength={100}
                                unstyled
                                className="flex-1 unstyled-field"
                                dense
                            />
                        </div>
                        
                        <div>
                            <label htmlFor="project-instructions" className="block text-semibold text-sm color-norm mb-2">
                                {c('collider_2025:Label').t`Project Instructions (optional)`}
                            </label>
                            <TextAreaTwo
                                id="project-instructions"
                                placeholder={c('collider_2025:Placeholder').t`Add instructions about the tone, style, and persona you want ${LUMO_SHORT_APP_NAME} to adopt.`}
                                value={projectInstructions}
                                className='border border-weak rounded-lg'
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

