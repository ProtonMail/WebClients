import { useEffect } from 'react';

import { useLumoAuthAction } from '../../../hooks/useLumoAuthAction';
import { useLumoFlags } from '../../../hooks/useLumoFlags';
import { useMaxModelAvailability } from '../../../hooks/useMaxModelAvailability';
import { useLumoPlan } from '../../../providers/LumoPlanProvider';
import {
    setNativeComposerIsImageGenEnabled,
    setNativeIsFreeUser,
    setNativeIsGuestUser,
    setNativeIsModelSectionEnabled,
    setNativeMaxModelAvailability,
} from '../../../remote/nativeComposerBridgeHelpers';
import { setNativeIsNativeAccountEnabled } from '../../../remote/nativeFeatureFlagsBridgeHelpers';
import { getMaxModelAvailability, useRemainingLimits } from '../../../services/usageLimitsStore';

export const useNativeComposerFeatureFlagsApi = () => {
    const lumoFlags = useLumoFlags();
    const lumoNativeComposerImageGenEnabled = lumoFlags.nativeComposerImages;
    const lumoNativeComposerModelSelectionEnabled = lumoFlags.nativeComposerModelSelection;
    const { isEnabled: isNativeAuthEnabled } = useLumoAuthAction();
    const { isLumoFree, isGuest } = useLumoPlan();
    const { isMaxAvailableByFlag } = useMaxModelAvailability();
    const remainingLimits = useRemainingLimits();

    // Native has no quota signal of its own, so it must receive the same predicate the web
    // picker applies (flag AND remaining quota). Sending the flag alone leaves the Max row
    // tappable after the pool is exhausted; ModelTierLimitsSync then resolves the selection
    // straight back to Lite, and native only ever observes `model: 'lumo-lite'`.
    const maxModelAvailability = getMaxModelAvailability(remainingLimits, {
        isMaxAvailable: isMaxAvailableByFlag,
    });

    useEffect(() => {
        setNativeComposerIsImageGenEnabled(lumoNativeComposerImageGenEnabled);
        setNativeIsModelSectionEnabled(lumoNativeComposerModelSelectionEnabled);
        setNativeIsNativeAccountEnabled(isNativeAuthEnabled);
    }, [lumoNativeComposerImageGenEnabled, lumoNativeComposerModelSelectionEnabled, isNativeAuthEnabled]);

    useEffect(() => {
        setNativeIsFreeUser(isLumoFree);
    }, [isLumoFree]);

    useEffect(() => {
        setNativeIsGuestUser(isGuest);
    }, [isGuest]);

    useEffect(() => {
        setNativeMaxModelAvailability(maxModelAvailability);
    }, [maxModelAvailability]);
};
