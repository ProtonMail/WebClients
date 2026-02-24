import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import {
    InputFieldTwo,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    TextAreaTwo,
} from '@proton/components';
import type { ModalStateProps } from '@proton/components';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { useLumoDispatch } from '../../../redux/hooks';
import { addSpace, pushSpaceRequest } from '../../../redux/slices/core/spaces';
import type { Space } from '../../../types';
import { IconPicker } from '../components/IconPicker';
import { DEFAULT_PROJECT_ICON } from '../constants';

interface ProjectEditModalProps extends ModalStateProps {
    projectId: string;
    currentName: string;
    currentInstructions?: string;
    space: Space;
    currentIcon?: string;
}

export const ProjectEditModal = ({
    projectId,
    currentName,
    currentInstructions,
    space,
    currentIcon,
    ...modalProps
}: ProjectEditModalProps) => {
    const [name, setName] = useState(currentName);
    const [instructions, setInstructions] = useState(currentInstructions || '');
    const [selectedIcon, setSelectedIcon] = useState<string>(currentIcon || DEFAULT_PROJECT_ICON);
    const dispatch = useLumoDispatch();

    const handleSave = () => {
        const updatedSpace = {
            ...space,
            projectName: name || undefined,
            projectInstructions: instructions || undefined,
            projectIcon: selectedIcon || undefined,
        };

        dispatch(addSpace(updatedSpace));
        dispatch(pushSpaceRequest({ id: projectId }));
        modalProps.onClose?.();
    };

    const handleCancel = () => {
        setName(currentName);
        setInstructions(currentInstructions || '');
        modalProps.onClose?.();
    };

    const handleIconSelect = (icon: string) => {
        setSelectedIcon(icon);
    };

    return (
        <ModalTwo {...modalProps} onClose={handleCancel} size="large">
            <ModalTwoHeader title={c('collider_2025:Title').t`Edit Project`} />
            <ModalTwoContent>
                <div className="flex flex-nowrap items-center border border-weak rounded-lg p-1 mb-4">
                    <IconPicker selectedIcon={selectedIcon} onSelectIcon={handleIconSelect} />

                    <InputFieldTwo
                        id="project-name"
                        className="unstyled-field"
                        placeholder={c('collider_2025:Placeholder').t`Enter project name`}
                        unstyled
                        dense
                        value={name}
                        onValue={setName}
                        onKeyDown={(e) => {
                            // Prevent space key from bubbling up to avoid closing modal
                            if (e.key === ' ') {
                                e.stopPropagation();
                            }
                        }}
                        autoFocus
                    />
                </div>
                <label htmlFor="project-instructions" className="text-semibold mb-1">
                    {c('collider_2025:Label').t`Instructions`}
                </label>
                <TextAreaTwo
                    id="project-instructions"
                    className="border border-weak rounded-lg"
                    placeholder={c('collider_2025:Placeholder')
                        .t`Add instructions about the tone, style, and persona you want ${LUMO_SHORT_APP_NAME} to adopt. These instructions will apply to all chats in this project.`}
                    value={instructions}
                    onValue={setInstructions}
                    onKeyDown={(e) => {
                        // Prevent space key from bubbling up to avoid closing modal
                        if (e.key === ' ') {
                            e.stopPropagation();
                        }
                    }}
                    rows={5}
                />
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={handleCancel} color="weak">
                    {c('collider_2025:Button').t`Cancel`}
                </Button>
                <Button
                    onClick={handleSave}
                    color="norm"
                    disabled={
                        currentName === name && currentInstructions === instructions && currentIcon === selectedIcon
                    }
                >
                    {c('collider_2025:Button').t`Save`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
