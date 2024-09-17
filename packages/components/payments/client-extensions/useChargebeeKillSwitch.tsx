import { useIsChargebeeEnabledWithoutParams } from '@proton/components/containers/payments/PaymentSwitcher';
import { type ChargebeeKillSwitch, type ChargebeeKillSwitchData } from '@proton/payments';
import { getIsConnectionIssue } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { setPaymentsVersion } from '@proton/shared/lib/api/payments';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { ChargebeeEnabled } from '@proton/shared/lib/interfaces';

import { useChargebeeContext } from './useChargebeeContext';

export const useChargebeeKillSwitch = () => {
    const chargebeeContext = useChargebeeContext();

    const isChargebeeEnabled = useIsChargebeeEnabledWithoutParams();

    const chargebeeKillSwitch: ChargebeeKillSwitch = (_data?: ChargebeeKillSwitchData) => {
        const { reason, data, error } = _data ?? {};
        if (error?.name === 'AbortError' || getIsConnectionIssue(error)) {
            return false;
        }

        if (chargebeeContext.enableChargebeeRef.current === ChargebeeEnabled.CHARGEBEE_ALLOWED) {
            chargebeeContext.enableChargebeeRef.current = ChargebeeEnabled.INHOUSE_FORCED;
            setPaymentsVersion('v4');
            chargebeeContext.setCalledKillSwitch('called');

            const sentryError = error ?? reason;
            if (sentryError) {
                const sendMessage = async () => {
                    const chargebeeEnabled = await isChargebeeEnabled();

                    const context = {
                        reason,
                        chargebeeEnabled,
                        ...data,
                    };

                    captureMessage('Payments: Chargebee kill switch activated', {
                        level: 'error',
                        extra: { error: sentryError, context },
                    });
                };

                void sendMessage();
            }

            return true;
        }

        return false;
    };

    const forceEnableChargebee = () => {
        chargebeeContext.enableChargebeeRef.current = ChargebeeEnabled.CHARGEBEE_FORCED;
        setPaymentsVersion('v5');
    };

    return {
        chargebeeKillSwitch,
        forceEnableChargebee,
    };
};
