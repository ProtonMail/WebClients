import { useEffect } from 'react';

import { useSettingsLink } from '@proton/components/index';

import { LUMO_SIGNUP_PATH } from '../../../constants';
import { useLumoPlan } from '../../../providers/LumoPlanProvider';
import { onNativeOpenAccount, setNativeComposerVisibility } from '../../../remote/nativeComposerBridgeHelpers';

export const useNativeComposerAccountApi = () => {
    const settingsLink = useSettingsLink();
    const { isGuest } = useLumoPlan();

    useEffect(() => {
        const unsubscribeOpenAccount = onNativeOpenAccount(() => {
            if (isGuest) {
                setNativeComposerVisibility(false);
                settingsLink(`${LUMO_SIGNUP_PATH}?plan=free`);
            }
        });
        return () => {
            unsubscribeOpenAccount();
        };
    }, [isGuest]);
};
