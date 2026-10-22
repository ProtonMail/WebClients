import { useCallback, useEffect } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import { useSilentApi } from '@proton/components/hooks/useSilentApi';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import noop from '@proton/utils/noop';

import { updateDelegatedAccess } from '../../../outgoingActions';
import { useOutgoingController } from '../../OutgoingDelegatedAccessProvider';
import type { ReEnableActionPayload } from '../interface';

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
