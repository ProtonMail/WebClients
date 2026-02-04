import { differenceInDays, fromUnixTime } from 'date-fns';

import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import useLocalState from '@proton/components/hooks/useLocalState';
import { getIsAssistantOpened } from '@proton/llm/lib';
import type { OpenedAssistant } from '@proton/llm/lib/types';
import { AI_ASSISTANT_ACCESS } from '@proton/shared/lib/interfaces';

interface Props {
    openedAssistants: OpenedAssistant[];
}

const NEW_USER_THRESHOLD_DAYS = 7;

/**
 * Used to make the assistant sticky (open it by default) when the user wants to
 * If the user opened manually the assistant, we set a value in the localStorage to true, so that on next
 * (composer or any other component using the assistant) opening, the assistant gets opened by default.
 * If the user is closing manually the assistant, we set the value to false.
 *
 * For new users (account age <= 7 days), the default value is true to encourage discovery.
 * For existing users (account age > 7 days), the default value is false.
 */
const useAssistantSticky = ({ openedAssistants }: Props) => {
    const [user] = useUser();
    const [{ AIAssistantFlags }] = useUserSettings();

    const isNewUser = differenceInDays(new Date(), fromUnixTime(user.CreateTime)) <= NEW_USER_THRESHOLD_DAYS;

    // For new users, default to true (show assistant). For existing users, default to false.
    const [stickyAssistant, setStickyAssistant] = useLocalState(isNewUser, `${user.ID}-open-assistant`);

    const setAssistantStickyOn = () => {
        setStickyAssistant(true);
    };

    const setAssistantStickyOff = () => {
        setStickyAssistant(false);
    };

    const getIsStickyAssistant = (assistantID: string, canShowAssistant: boolean) => {
        // Assistant can be opened if:
        // - value in localStorage is true
        // - Feature flag is ON
        // - user can run the assistant (if user has local mode in settings, but cannot run it, then we don't open it)
        // - There is no other assistant opened (as long as we don't have a queue mechanism)
        if (stickyAssistant) {
            const isAssistantOpenedInComposer = getIsAssistantOpened(openedAssistants, assistantID);

            if (AIAssistantFlags === AI_ASSISTANT_ACCESS.SERVER_ONLY) {
                return canShowAssistant && !isAssistantOpenedInComposer;
            }
            return canShowAssistant && openedAssistants.length === 0 && !isAssistantOpenedInComposer;
        }
        return false;
    };

    return { getIsStickyAssistant, setAssistantStickyOff, setAssistantStickyOn };
};

export default useAssistantSticky;
