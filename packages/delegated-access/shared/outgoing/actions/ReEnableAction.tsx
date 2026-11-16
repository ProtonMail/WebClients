import { useCallback, useEffect } from 'react';

import { c } from 'ttag';

import { updateDelegatedAccess } from '@proton/account/delegatedAccess/outgoingActions';
import { useOutgoingController } from '@proton/account/delegatedAccess/shared/OutgoingDelegatedAccessProvider';
import type { ReEnableActionPayload } from '@proton/account/delegatedAccess/shared/outgoing/interface';
import { useDispatch } from '@proton/account/store/hooks';
import { useNotifications } from '@proton/app-context/useNotifications';
import { useSilentApi } from '@proton/app-context/useSilentApi';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import noop from '@proton/utils/noop';

export const ReEnableAction = () => {
    const { subscribe } = useOutgoingController();

    const handleError = useErrorHandler();
    const dispatch = useDispatch();
    const silentApi = useSilentApi();
    const { createNotification } = useNotifications();

    const action = useCallback(async (value: ReEnableActionPayload['value'], successText: string) => {
        try {
            await dispatch(
                updateDelegatedAccess({
                    delegatedAccess: value.outgoingDelegatedAccess,
                    api: silentApi,
                })
            );

            createNotification({ text: successText });
        } catch (e) {
            handleError(e);
        }
    }, []);

    useEffect(() => {
        return subscribe((payload) => {
            if (payload.type === 'enable-emergency-contact') {
                action(payload.value, c('emergency_access').t`Emergency contact enabled`).catch(noop);
            }
            if (payload.type === 'enable-recovery-contact') {
                action(payload.value, c('emergency_access').t`Recovery contact enabled`).catch(noop);
            }
        });
    }, []);

    return null;
};
