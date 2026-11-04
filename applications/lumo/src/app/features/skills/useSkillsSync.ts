import { useEffect } from 'react';

import { useLumoFlags } from '../../hooks/useLumoFlags';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { useLumoDispatch, useLumoSelector } from '../../redux/hooks';
import { selectMasterKeyState } from '../../redux/selectors';
import { syncSkills } from './skillSync';

/**
 * Syncs skills with the server once the master key is ready, without waiting for a skills view to load them.
 * Skills are a signed-in feature behind the skills flags.
 */
export const useSkillsSync = () => {
    const dispatch = useLumoDispatch();
    const isGuest = useIsGuest();
    const { skills } = useLumoFlags();
    const masterKeyReady = useLumoSelector(selectMasterKeyState).status === 'ready';
    const enabled = skills && !isGuest && masterKeyReady;

    useEffect(() => {
        if (enabled) {
            void dispatch(syncSkills());
        }
    }, [dispatch, enabled]);
};
