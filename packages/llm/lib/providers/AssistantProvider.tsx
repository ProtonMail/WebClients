import { ReactNode } from 'react';

import { FeatureFlag } from '@proton/components/containers';
import { useUserSettings } from '@proton/components/hooks';
import { AI_ASSISTANT_ACCESS } from '@proton/shared/lib/interfaces';

import useAssistantCommons from '../hooks/useAssistantCommons';
import { useAssistantLocal } from '../hooks/useAssistantLocal';
import { useAssistantServer } from '../hooks/useAssistantServer';
import useOpenedAssistants from '../hooks/useOpenedAssistants';
import { AssistantContext } from '../useAssistant';

export interface AssistantProviderProps {
    children: ReactNode;
    assistantFeature: FeatureFlag;
}

const AssistantProvider = ({ children, assistantFeature }: AssistantProviderProps) => {
    const [userSettings] = useUserSettings();
    const assistantMode = userSettings.AIAssistantFlags;
    const isAssistantLocal = assistantMode === AI_ASSISTANT_ACCESS.CLIENT_ONLY;

    const commonState = useAssistantCommons({ assistantFeature });
    const openedAssistantsState = useOpenedAssistants({ cleanSpecificErrors: commonState.cleanSpecificErrors });
    const assistantServerState = useAssistantServer({ commonState, openedAssistantsState });
    const assistantLocalState = useAssistantLocal({ commonState, openedAssistantsState, active: isAssistantLocal });

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

    return <AssistantContext.Provider value={assistantState}>{children}</AssistantContext.Provider>;
};

export default AssistantProvider;
