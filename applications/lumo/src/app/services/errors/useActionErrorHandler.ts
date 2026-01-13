import { useCallback } from 'react';

import { useErrorHandler as useProtonErrorHandler } from '@proton/components';

import { useLumoPlan } from '../../providers/LumoPlanProvider';
import { useLumoDispatch } from '../../redux/hooks';
import { type ErrorContext, LUMO_API_ERRORS } from '../../types';
import { analyzeError } from './errorAnalyzer';
import { handleGenerationError, handleTierError } from './errorHandling';

export const useActionErrorHandler = () => {
    const dispatch = useLumoDispatch();
    const handleError = useProtonErrorHandler();
    const { lumoUserType } = useLumoPlan();

    const handleActionError = useCallback(
        (error: any, context: ErrorContext) => {
            const analyzed = analyzeError(error, context);

            // Don't show validation or abort errors to user
            if (!analyzed.shouldShowToUser) {
                return;
            }

            const conversationId = context.conversationId;

            if (!conversationId) {
                return;
            }

            // Handle based on error category
            switch (analyzed.category) {
                case 'api':
                    if (analyzed.lumoErrorType === LUMO_API_ERRORS.TIER_LIMIT) {
                        dispatch(handleTierError(lumoUserType));
                    } else if (analyzed.lumoErrorType) {
                        dispatch(
                            handleGenerationError({
                                type: analyzed.lumoErrorType,
                                conversationId,
                                originalMessage: { type: 'error' } as any,
                                actionParams: context.actionParams,
                            })
                        );
                    }
                    break;

                case 'network':
                    dispatch(
                        handleGenerationError({
                            type: LUMO_API_ERRORS.STREAM_DISCONNECTED,
                            conversationId,
                            originalMessage: { type: 'error' } as any,
                            actionParams: context.actionParams,
                        })
                    );
                    break;

                default:
                    // Use fallback handler for unknown errors
                    handleError(error);
                    break;
            }
        },
        [dispatch, handleError, lumoUserType]
    );

    return { handleActionError };
};
