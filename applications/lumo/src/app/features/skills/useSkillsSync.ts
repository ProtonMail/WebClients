import { useEffect } from 'react';

import { useLumoFlags } from '../../hooks/useLumoFlags';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { useLumoDispatch, useLumoSelector } from '../../redux/hooks';
import { selectMasterKeyState } from '../../redux/selectors';
import { syncSkills } from './skillSync';

/**
 * Syncs skills with the server once the master key is ready, without waiting for a skills view to load them.
 * Skills are a signed-in feature behind the custom agents flag.
 */
export const useSkillsSync = () => {
    const dispatch = useLumoDispatch();
    const isGuest = useIsGuest();
    const { customAgents } = useLumoFlags();
    const masterKeyReady = useLumoSelector(selectMasterKeyState).status === 'ready';
    const enabled = customAgents && !isGuest && masterKeyReady;

    useEffect(() => {
        if (enabled) {
            void dispatch(syncSkills());
        }
    }, [dispatch, enabled]);
};
