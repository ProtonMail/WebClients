import { c } from 'ttag';

import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { addConversationError, addTierError } from '../../redux/slices/meta/errors';
import type { LumoDispatch } from '../../redux/store';
import { type ConversationId, type GenerationError, LUMO_API_ERRORS, type LUMO_USER_TYPE } from '../../types';
import type { GenerationResponseMessage } from '../../types-api';
import { getExceedTierErrorMessage, getExceededTierErrorTitle } from '../../util/errorMessages';

export const createGenerationError = (
    type: LUMO_API_ERRORS,
    conversationId: ConversationId,
    originalMessage: GenerationResponseMessage
): GenerationError => ({
    type,
    conversationId,
    originalMessage,
});

export const getErrorTypeFromMessage = (messageType: GenerationResponseMessage['type']): LUMO_API_ERRORS => {
    switch (messageType) {
        case 'error':
            return LUMO_API_ERRORS.GENERATION_ERROR;
        case 'rejected':
            return LUMO_API_ERRORS.GENERATION_REJECTED;
        case 'timeout':
            return LUMO_API_ERRORS.HIGH_DEMAND;
        case 'harmful':
            return LUMO_API_ERRORS.HARMFUL_CONTENT;
        default:
            return LUMO_API_ERRORS.GENERATION_ERROR;
    }
};

export const handleGenerationError = (error: GenerationError) => (dispatch: LumoDispatch) => {
    // Log the error for analytics/debugging
    console.error('Generation Error:', {
        type: error.type,
        conversationId: error.conversationId,
    });

    // Handle specific error types
    switch (error.type) {
        case LUMO_API_ERRORS.GENERATION_ERROR:
            dispatch(
                addConversationError({
                    conversationId: error.conversationId,
                    errorTitle: c('collider_2025: Error Title').t`Something went wrong`,
                    errorMessage: c('collider_2025: Error Message')
                        .t`Your request didn't go through or couldn't be completed. Try sending it again.`,
                    errorType: error.type,
                    actionParams: error.actionParams,
                })
            );
            break;

        case LUMO_API_ERRORS.HIGH_DEMAND:
            dispatch(
                addConversationError({
                    conversationId: error.conversationId,
                    errorTitle: c('collider_2025: Error Title').t`${LUMO_SHORT_APP_NAME}'s a busy cat`,
                    errorMessage: c('collider_2025: Error Message')
                        .t`We're experiencing unusually high demand. If retrying doesn't work, check back in a few minutes or upgrade for priority access to ${LUMO_SHORT_APP_NAME}.`,
                    errorType: error.type,
                    actionParams: error.actionParams,
                })
            );
            break;

        case LUMO_API_ERRORS.GENERATION_REJECTED:
            dispatch(
                addConversationError({
                    conversationId: error.conversationId,
                    errorTitle: c('collider_2025: Error Title').t`Looks like there's a lot of traffic`,
                    errorMessage: c('collider_2025: Error Message')
                        .t`If retrying doesn’t work, check back later or consider upgrading to ${LUMO_SHORT_APP_NAME} Plus to jump to the front of the line during peak times.`,
                    errorType: error.type,
                    actionParams: error.actionParams,
                })
            );
            break;

        case LUMO_API_ERRORS.HARMFUL_CONTENT:
            dispatch(
                addConversationError({
                    conversationId: error.conversationId,
                    errorTitle: c('collider_2025: Error Title')
                        .t`${LUMO_SHORT_APP_NAME} can't assist with that request. `,
                    errorMessage: c('collider_2025: Error Message')
                        .t`Please try asking a different question or making a different request.`,
                    errorType: error.type,
                    actionParams: error.actionParams,
                })
            );
            break;

        case LUMO_API_ERRORS.STREAM_DISCONNECTED:
            dispatch(
                addConversationError({
                    conversationId: error.conversationId,
                    errorTitle: c('collider_2025: Error Title').t`Connection interrupted`,
                    errorMessage: c('collider_2025: Error Message')
                        .t`Your request was queued but the connection was interrupted. This usually happens when ${LUMO_SHORT_APP_NAME} is experiencing high demand. Please try again.`,
                    errorType: error.type,
                    actionParams: error.actionParams,
                })
            );
            break;

        default:
            dispatch(
                addConversationError({
                    conversationId: error.conversationId,
                    errorTitle: c('collider_2025: Error Title').t`Something went wrong`,
                    errorMessage: c('collider_2025: Error Message')
                        .t`Your request didn't go through or couldn't be completed. Try sending it again.`,
                    errorType: error.type,
                    actionParams: error.actionParams,
                })
            );
    }
};

export const handleTierError = (userType: LUMO_USER_TYPE) => (dispatch: LumoDispatch) => {
    dispatch(
        addTierError({
            userType,
            errorTitle: getExceededTierErrorTitle(),
            errorMessage: getExceedTierErrorMessage(userType),
            errorType: LUMO_API_ERRORS.TIER_LIMIT,
        })
    );
};
