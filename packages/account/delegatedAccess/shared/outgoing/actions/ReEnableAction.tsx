import { useCallback, useEffect } from 'react';

import { c } from 'ttag';

import useApi from '@proton/components/hooks/useApi';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import noop from '@proton/utils/noop';

import { updateDelegatedAccess } from '../../../outgoingActions';
import { useDispatch } from '../../../useDispatch';
import { useOutgoingController } from '../../OutgoingDelegatedAccessProvider';
import type { ReEnableActionPayload } from '../interface';

export const ReEnableAction = () => {
    const { subscribe } = useOutgoingController();

    const handleError = useErrorHandler();
    const dispatch = useDispatch();
    const api = useApi();
    const { createNotification } = useNotifications();

    const action = useCallback(async (value: ReEnableActionPayload['value'], successText: string) => {
        try {
            await dispatch(
                updateDelegatedAccess({
                    delegatedAccess: value.outgoingDelegatedAccess,
                    api: getSilentApi(api),
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
