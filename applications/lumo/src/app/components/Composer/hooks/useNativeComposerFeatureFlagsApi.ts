import { useEffect } from 'react';

import { useLumoFlags } from '../../../hooks/useLumoFlags';
import { useLumoPlan } from '../../../providers/LumoPlanProvider';
import {
    setNativeComposerIsImageGenEnabled,
    setNativeIsFreeUser,
    setNativeIsGuestUser,
    setNativeIsModelSectionEnabled,
} from '../../../remote/nativeComposerBridgeHelpers';

export const useNativeComposerFeatureFlagsApi = () => {
    const lumoFlags = useLumoFlags();
    const lumoNativeComposerImageGenEnabled = lumoFlags.nativeComposerImages;
    const lumoNativeComposerModelSelectionEnabled = lumoFlags.nativeComposerModelSelection;
    const { isLumoFree, isGuest } = useLumoPlan();

    useEffect(() => {
        setNativeComposerIsImageGenEnabled(lumoNativeComposerImageGenEnabled);
        setNativeIsModelSectionEnabled(lumoNativeComposerModelSelectionEnabled);
    }, [lumoNativeComposerImageGenEnabled, lumoNativeComposerModelSelectionEnabled]);

    useEffect(() => {
        setNativeIsFreeUser(isLumoFree);
    }, [isLumoFree]);

    useEffect(() => {
        setNativeIsGuestUser(isGuest);
    }, [isGuest]);
};
