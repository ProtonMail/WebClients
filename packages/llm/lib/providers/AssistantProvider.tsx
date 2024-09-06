import type { ReactNode } from 'react';

import { useUserSettings } from '@proton/components/hooks';
import { AI_ASSISTANT_ACCESS } from '@proton/shared/lib/interfaces';

import { AssistantContext } from '../hooks/useAssistant';
import useAssistantCommons from '../hooks/useAssistantCommons';
import { useAssistantLocal } from '../hooks/useAssistantLocal';
import { useAssistantServer } from '../hooks/useAssistantServer';

export interface AssistantProviderProps {
    children: ReactNode;
}

const AssistantProvider = ({ children }: AssistantProviderProps) => {
    const [userSettings] = useUserSettings();
    const assistantMode = userSettings.AIAssistantFlags;
    const isAssistantLocal = assistantMode === AI_ASSISTANT_ACCESS.CLIENT_ONLY;

    const commonState = useAssistantCommons();
    const assistantServerState = useAssistantServer({ commonState });
    const assistantLocalState = useAssistantLocal({ commonState, active: isAssistantLocal });

    /**
     * Use the local provider in case setting is CLIENT_ONLY
     * Else, we are using the server side provider
     * - SERVER_ONLY: The user wants to use the server mode
     * - UNSET: Server is the default, so if the user is in UNSET mode, we are using the server mode
     * - OFF: When assistant is OFF, we still need a context otherwise calling useAssistant will trigger an error
     *          I was also considering to create a new "dummy" provider so that we don't run useless computations,
     *          but it means that we would need to maintain an additional Provider.
     *          In the end we decided to run the server provider that has fewer computations than the local one
     */
    const assistantState = isAssistantLocal ? assistantLocalState : assistantServerState;

    return (
        <AssistantContext.Provider
            value={{
                ...commonState,
                ...assistantState,
                // Needed to call initAssistant on composer assistant inner modal submit
                // In this case assistant context is still set to server mode so initAssistant was undefined.
                // in order to call initAssistant with no side effects I made a duplicate
                handleSettingChange: assistantLocalState.initAssistant,
            }}
        >
            {children}
        </AssistantContext.Provider>
    );
};

export default AssistantProvider;
