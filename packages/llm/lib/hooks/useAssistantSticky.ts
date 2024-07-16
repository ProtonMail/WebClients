import { useLocalState, useUser } from '@proton/components/hooks';
import { getIsAssistantOpened } from '@proton/llm/lib';
import { OpenedAssistant } from '@proton/llm/lib/types';

interface Props {
    openedAssistants: OpenedAssistant[];
}
const useAssistantSticky = ({ openedAssistants }: Props) => {
    const [user] = useUser();
    const [stickyAssistant, setStickyAssistant] = useLocalState(false, `${user.ID}-open-assistant`);

    const setAssistantStickyOn = () => {
        setStickyAssistant(true);
    };

    const setAssistantStickyOff = () => {
        setStickyAssistant(false);
    };

    const getIsStickyAssistant = (assistantID: string, canShowAssistant: boolean, canRunAssistant: boolean) => {
        if (stickyAssistant) {
            const isAssistantOpenedInComposer = getIsAssistantOpened(openedAssistants, assistantID);
            return canShowAssistant && canRunAssistant && openedAssistants.length === 0 && !isAssistantOpenedInComposer;
        }
        return false;
    };

    return { getIsStickyAssistant, setAssistantStickyOff, setAssistantStickyOn };
};

export default useAssistantSticky;
