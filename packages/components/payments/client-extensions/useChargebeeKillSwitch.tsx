import { setPaymentsVersion } from '@proton/shared/lib/api/payments';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { ChargebeeEnabled } from '@proton/shared/lib/interfaces';

import { ChargebeeKillSwitch, ChargebeeKillSwitchData } from '../core';
import { useChargebeeContext } from './useChargebeeContext';

export const useChargebeeKillSwitch = () => {
    const chargebeeContext = useChargebeeContext();

    const chargebeeKillSwitch: ChargebeeKillSwitch = (_data?: ChargebeeKillSwitchData) => {
        const { reason, data, error } = _data ?? {};
        if (error?.name === 'AbortError') {
            return false;
        }

        if (chargebeeContext.enableChargebee === ChargebeeEnabled.CHARGEBEE_ALLOWED) {
            chargebeeContext.setEnableChargebee(ChargebeeEnabled.INHOUSE_FORCED);
            setPaymentsVersion('v4');
            chargebeeContext.setCalledKillSwitch('called');

            const sentryError = error ?? reason;
            if (sentryError) {
                const context = {
                    reason,
                    ...data,
                };

                captureMessage('Payments: Chargebee kill switch activated', {
                    level: 'error',
                    extra: { error: sentryError, context },
                });
            }

            return true;
        }

        return false;
    };

    const forceEnableChargebee = () => {
        chargebeeContext.setEnableChargebee(ChargebeeEnabled.CHARGEBEE_ALLOWED);
        setPaymentsVersion('v5');
    };

    return {
        chargebeeKillSwitch,
        forceEnableChargebee,
    };
};
