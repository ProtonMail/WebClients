import { useEffect } from 'react';

import { contactEmailsThunk } from '@proton/mail/store/contactEmails';
import { useDispatch, useSelector } from '@proton/redux-shared-store/sharedProvider';
import noop from '@proton/utils/noop';

import { selectIsDelegatedAccessSupported } from '../../delegatedAccess';
import { listOutgoingDelegatedAccess } from '../../delegatedAccess/outgoingActions';
import { type RecoveryStateResult, selectRecoveryState } from './recoveryState';

/**
 * Fetches the models `selectRecoveryState` depends on but that no other model hook covers. The outgoing delegated
 * access list is only otherwise fetched by the components that render recovery and emergency contacts, so on pages
 * or apps that hide them (e.g. VPN settings) the recovery state would stay in a loading state forever.
 *
 * The thunk is cached and resolves to an empty list outside of Account, so calling this from several places is free.
 */
export const useLoadRecoveryState = () => {
    const dispatch = useDispatch();
    const isDelegatedAccessSupported = useSelector(selectIsDelegatedAccessSupported);

    useEffect(() => {
        dispatch(listOutgoingDelegatedAccess()).catch(noop);
        // Contact emails back the recovery and emergency contact steps, so they're only needed where those exist.
        if (isDelegatedAccessSupported) {
            dispatch(contactEmailsThunk()).catch(noop);
        }
    }, []);
};

/** Reads the recovery state and ensures the models it derives from are fetched. */
export const useRecoveryState = (): RecoveryStateResult => {
    useLoadRecoveryState();
    return useSelector(selectRecoveryState);
};
