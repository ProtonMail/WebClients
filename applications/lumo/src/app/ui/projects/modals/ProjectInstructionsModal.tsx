import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader, TextAreaTwo } from '@proton/components';
import type { ModalStateProps } from '@proton/components';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { useLumoDispatch } from '../../../redux/hooks';
import { addSpace, pushSpaceRequest } from '../../../redux/slices/core/spaces';
import type { Space } from '../../../types';

import './ProjectInstructionsModal.scss';

interface ProjectInstructionsModalProps extends ModalStateProps {
    projectId: string;
    currentInstructions?: string;
    space: Space;
}

export const ProjectInstructionsModal = ({
    projectId,
    currentInstructions,
    space,
    ...modalProps
}: ProjectInstructionsModalProps) => {
    const [instructions, setInstructions] = useState(currentInstructions || '');
    const dispatch = useLumoDispatch();

    const handleSave = () => {
        // Update the space with new instructions, preserving all other data
        const updatedSpace = {
            ...space,
            projectInstructions: instructions || undefined,
        };
        
        dispatch(addSpace(updatedSpace));
        dispatch(pushSpaceRequest({ id: projectId }));
        modalProps.onClose?.();
    };

    const handleCancel = () => {
        setInstructions(currentInstructions || '');
        modalProps.onClose?.();
    };

    return (
        <ModalTwo {...modalProps} onClose={handleCancel} size="large">
            <ModalTwoHeader title={c('collider_2025:Title').t`Edit Instructions`} />
            <ModalTwoContent>
                <TextAreaTwo
                    id="project-instructions"
                    className={'project-instruction-edit-area'}
                    placeholder={c('collider_2025:Placeholder').t`Add instructions about the tone, style, and persona you want ${LUMO_SHORT_APP_NAME} to adopt. These instructions will apply to all chats in this project.`}
                    value={instructions}
                    onValue={setInstructions}
                    rows={10}
                    autoFocus
                />
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={handleCancel} color="weak">
                    {c('collider_2025:Button').t`Cancel`}
                </Button>
                <Button onClick={handleSave} color="norm">
                    {c('collider_2025:Button').t`Save`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

