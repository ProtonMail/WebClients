import { createContext, useContext } from 'react';

import { LUMO_USER_TYPE } from '../types';

export interface LumoCommonProps {
    lumoUserType: LUMO_USER_TYPE;
    // errors: AssistantError[];
    // addSpecificError: ({
    //     conversationId,
    //     errorType,
    // }: {
    //     conversationId: ConversationId;
    //     errorType: LUMO_API_ERRORS;
    // }) => void;
    // addExceedTierError: (userType: LUMO_USER_TYPE) => void;
}

export const LumoCommonContext = createContext<LumoCommonProps | null>(null);

export const useLumoCommon = (converationId?: string) => {
    const assistantContext = useContext(LumoCommonContext);

    if (!assistantContext) {
        throw new Error('Assistant provider not initialized');
    }

    const { lumoUserType } = assistantContext;

    return {
        lumoUserType,
        isGuest: lumoUserType === LUMO_USER_TYPE.GUEST,
        isLumoFree: lumoUserType === LUMO_USER_TYPE.FREE,
        isLumoPaid: lumoUserType === LUMO_USER_TYPE.PAID,
    };
};
