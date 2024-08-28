import { useLocalState, useUser, useUserSettings } from '@proton/components/hooks';
import { getIsAssistantOpened } from '@proton/llm/lib';
import type { OpenedAssistant } from '@proton/llm/lib/types';
import { AI_ASSISTANT_ACCESS } from '@proton/shared/lib/interfaces';

interface Props {
    openedAssistants: OpenedAssistant[];
}

/**
 * Used to make the assistant sticky (open it by default) when the user wants to
 * If the user opened manually the assistant, we set a value in the localStorage to true, so that on next
 * (composer or any other component using the assistant) opening, the assistant gets opened by default.
 * If the user is closing manually the assistant, we set the value to false.
 */
const useAssistantSticky = ({ openedAssistants }: Props) => {
    const [user] = useUser();
    const [{ AIAssistantFlags }] = useUserSettings();
    const [stickyAssistant, setStickyAssistant] = useLocalState(false, `${user.ID}-open-assistant`);

    const setAssistantStickyOn = () => {
        setStickyAssistant(true);
    };

    const setAssistantStickyOff = () => {
        setStickyAssistant(false);
    };

    const getIsStickyAssistant = (assistantID: string, canShowAssistant: boolean, canRunAssistant: boolean) => {
        // Assistant can be opened if:
        // - value in localStorage is true
        // - Feature flag is ON
        // - user can run the assistant (if user has local mode in settings, but cannot run it, then we don't open it)
        // - There is no other assistant opened (as long as we don't have a queue mechanism)
        if (stickyAssistant && !user.isFree) {
            const isAssistantOpenedInComposer = getIsAssistantOpened(openedAssistants, assistantID);

            if (AIAssistantFlags === AI_ASSISTANT_ACCESS.SERVER_ONLY) {
                return canShowAssistant && canRunAssistant && !isAssistantOpenedInComposer;
            }
            return canShowAssistant && canRunAssistant && openedAssistants.length === 0 && !isAssistantOpenedInComposer;
        }
        return false;
    };

    return { getIsStickyAssistant, setAssistantStickyOff, setAssistantStickyOn };
};

export default useAssistantSticky;
