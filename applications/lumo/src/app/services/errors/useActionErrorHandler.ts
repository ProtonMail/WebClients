import { useCallback, useRef } from 'react';

import { useApi } from '@proton/app-context/useApi';
import { useErrorHandler as useProtonErrorHandler } from '@proton/components';
import { fetchUsageLimits } from '@proton/lumo-api-client/core/network';

import { getSelectedModelTier, useOptionalModelTier } from '../../providers/ModelTierProvider';
import { useLumoPlan } from '../../providers/LumoPlanProvider';
import { useLumoDispatch } from '../../redux/hooks';
import { onComposerError } from '../../remote/nativeComposerBridgeHelpers';
import {
    getExhaustedLimitForModel,
    getRemainingLimits,
    getRemainingLimitsRevision,
    markModelLimitExhausted,
    setRemainingLimits,
} from '../../services/usageLimitsStore';
import { type ErrorContext, LUMO_API_ERRORS } from '../../types';
import { analyzeError } from './errorAnalyzer';
import { handleGenerationError, handleTierError } from './errorHandling';

export const useActionErrorHandler = () => {
    const api = useApi();
    const dispatch = useLumoDispatch();
    const handleError = useProtonErrorHandler();
    const { hasLumoPlus, lumoUserType } = useLumoPlan();
    const modelTierContext = useOptionalModelTier();
    const selectedModelTier = modelTierContext ? getSelectedModelTier(modelTierContext.modelTier) : undefined;
    const limitCheckIdRef = useRef(0);

    const handleActionError = useCallback(
        (error: any, context: ErrorContext) => {
            const analyzed = analyzeError(error);

            // Don't show validation or abort errors to user
            if (!analyzed.shouldShowToUser) {
                return;
            }

            const conversationId = context.conversationId;

            if (!conversationId) {
                return;
            }

            const dispatchGenerationError = (type: LUMO_API_ERRORS) => {
                dispatch(
                    handleGenerationError(
                        {
                            type,
                            conversationId,
                            originalMessage: { type: 'error' } as any,
                            actionParams: context.actionParams,
                        },
                        lumoUserType
                    )
                );
            };

            // Handle based on error category
            switch (analyzed.category) {
                case 'api':
                    if (analyzed.lumoErrorType === LUMO_API_ERRORS.TIER_LIMIT) {
                        const checkId = ++limitCheckIdRef.current;
                        const limitsRevision = getRemainingLimitsRevision();

                        void fetchUsageLimits(api)
                            .then((fetchedLimits) => {
                                if (checkId !== limitCheckIdRef.current) {
                                    return;
                                }

                                let limits = getRemainingLimits();
                                if (getRemainingLimitsRevision() === limitsRevision) {
                                    setRemainingLimits(fetchedLimits);
                                    limits = fetchedLimits;
                                }

                                const exhaustedLimit = getExhaustedLimitForModel(limits, selectedModelTier);

                                if (!hasLumoPlus && exhaustedLimit) {
                                    markModelLimitExhausted(
                                        exhaustedLimit.limitCategory,
                                        exhaustedLimit.modelTier
                                    );
                                    dispatch(handleTierError(lumoUserType));
                                    return;
                                }

                                dispatchGenerationError(LUMO_API_ERRORS.RATE_LIMIT);
                            })
                            .catch(() => {
                                if (checkId === limitCheckIdRef.current) {
                                    dispatchGenerationError(LUMO_API_ERRORS.RATE_LIMIT);
                                }
                            });
                    } else if (analyzed.lumoErrorType) {
                        dispatchGenerationError(analyzed.lumoErrorType);
                    }
                    break;

                case 'network':
                    dispatchGenerationError(LUMO_API_ERRORS.STREAM_DISCONNECTED);
                    break;

                default:
                    // Use fallback handler for unknown errors
                    onComposerError(LUMO_API_ERRORS.UNKNOWN);
                    handleError(error);
                    break;
            }
        },
        [api, dispatch, handleError, hasLumoPlus, lumoUserType, selectedModelTier]
    );

    return { handleActionError };
};
