import { useState } from 'react';

import { getIsAssistantOpened } from '@proton/llm/lib/helpers';
import { OpenedAssistant, OpenedAssistantStatus } from '@proton/llm/lib/types';

interface Props {
    cleanSpecificErrors: (assistantID: string) => void;
}

const useOpenedAssistants = ({ cleanSpecificErrors }: Props) => {
    const [openedAssistants, setOpenedAssistants] = useState<OpenedAssistant[]>([]);

    // By default, open the assistant with the collapsed status
    const openAssistant = (assistantID: string, status: OpenedAssistantStatus = OpenedAssistantStatus.COLLAPSED) => {
        const newAssistant: OpenedAssistant = {
            id: assistantID,
            status,
        };
        setOpenedAssistants([...openedAssistants, newAssistant]);
    };

    const setAssistantStatus = (assistantID: string, status: OpenedAssistantStatus) => {
        const assistant = openedAssistants.find((assistant) => assistant.id === assistantID);
        if (assistant) {
            const updatedAssistant = { ...assistant, status };
            const filteredAssistants = openedAssistants.filter((assistant) => assistant.id !== assistantID);

            setOpenedAssistants([...filteredAssistants, updatedAssistant]);
        }
    };

    const closeAssistant = (cancelRunningAction: (assistantId: string) => void) => (assistantID: string) => {
        const isAssistantOpened = getIsAssistantOpened(openedAssistants, assistantID);
        if (isAssistantOpened) {
            const filteredAssistants = openedAssistants.filter((assistant) => assistant.id !== assistantID);
            setOpenedAssistants(filteredAssistants);
            cancelRunningAction(assistantID);
            cleanSpecificErrors(assistantID);
        }
    };

    return { openedAssistants, openAssistant, setAssistantStatus, closeAssistant };
};

export default useOpenedAssistants;
