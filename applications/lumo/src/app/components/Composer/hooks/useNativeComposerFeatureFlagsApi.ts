import { useEffect } from 'react';

import { useLumoAuthAction } from '../../../hooks/useLumoAuthAction';
import { useLumoFlags } from '../../../hooks/useLumoFlags';
import { useLumoPlan } from '../../../providers/LumoPlanProvider';
import {
    setNativeComposerIsImageGenEnabled,
    setNativeIsFreeUser,
    setNativeIsGuestUser,
    setNativeIsModelSectionEnabled,
} from '../../../remote/nativeComposerBridgeHelpers';
import { setNativeIsNativeAccountEnabled } from '../../../remote/nativeFeatureFlagsBridgeHelpers';

export const useNativeComposerFeatureFlagsApi = () => {
    const lumoFlags = useLumoFlags();
    const lumoNativeComposerImageGenEnabled = lumoFlags.nativeComposerImages;
    const lumoNativeComposerModelSelectionEnabled = lumoFlags.nativeComposerModelSelection;
    const { isEnabled: isNativeAuthEnabled } = useLumoAuthAction();
    const { isLumoFree, isGuest } = useLumoPlan();

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
};
