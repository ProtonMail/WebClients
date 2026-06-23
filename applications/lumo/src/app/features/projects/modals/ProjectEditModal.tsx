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

import { useUncontrolledField } from '../../../hooks/useUncontrolledField';
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
    const name = useUncontrolledField<HTMLInputElement>(currentName);
    const instructions = useUncontrolledField<HTMLTextAreaElement>(currentInstructions || '');
    const [selectedIcon, setSelectedIcon] = useState<string>(currentIcon || DEFAULT_PROJECT_ICON);
    const dispatch = useLumoDispatch();

    const handleSave = () => {
        const updatedSpace = {
            ...space,
            projectName: name.getValue() || undefined,
            projectInstructions: instructions.getValue() || undefined,
            projectIcon: selectedIcon || undefined,
        };

        dispatch(addSpace(updatedSpace));
        dispatch(pushSpaceRequest({ id: projectId }));
        modalProps.onClose?.();
    };

    const handleCancel = () => {
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
                        {...name.bind}
                        id="project-name"
                        className="unstyled-field"
                        placeholder={c('collider_2025:Placeholder').t`Enter project name`}
                        unstyled
                        dense
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
                    {...instructions.bind}
                    id="project-instructions"
                    className="border border-weak rounded-lg"
                    placeholder={c('collider_2025:Placeholder')
                        .t`Add instructions about the tone, style, and persona you want ${LUMO_SHORT_APP_NAME} to adopt. These instructions will apply to all chats in this project.`}
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
                        currentName === name.value &&
                        (currentInstructions || '') === instructions.value &&
                        currentIcon === selectedIcon
                    }
                >
                    {c('collider_2025:Button').t`Save`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
