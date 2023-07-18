import { useCallback, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { popupMessage, sendMessage } from '@proton/pass/extension/message';
import type { MaybeNull, OtpCode, OtpRequest } from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';

import { useEnsureMounted } from './useEnsureMounted';

export type Props = OtpRequest & { totpUri?: string };

const requestOtpCodeGeneration = async (payload: OtpRequest): Promise<MaybeNull<OtpCode>> =>
    sendMessage.on(
        popupMessage({
            type: WorkerMessageType.OTP_CODE_GENERATE,
            payload,
        }),
        (response) => (response.type === 'success' ? response : null)
    );

export const usePeriodicOtpCode = ({ totpUri, ...request }: Props): [MaybeNull<OtpCode>, number] => {
    const { shareId, itemId, type } = request;
    const [otp, setOtp] = useState<MaybeNull<OtpCode>>(null);
    const [percentage, setPercentage] = useState<number>(-1);
    const requestAnimationRef = useRef<number>(-1);
    const ensureMounted = useEnsureMounted();

    const { createNotification } = useNotifications();

    /* Only trigger the countdown if we have a valid
     * OTP code with a valid period - else do nothing */
    const doRequestOtpCodeGeneration = useCallback(async () => {
        const otpCode = await requestOtpCodeGeneration(request);
        ensureMounted(setOtp)(otpCode);

        if (otpCode === null) {
            return createNotification({
                text: c('Error').t`Unable to generate an OTP code for this item`,
                type: 'error',
            });
        }

        if (otpCode !== null && otpCode.period && otpCode.period > 0) {
            const applyCountdown = ensureMounted(() => {
                requestAnimationRef.current = requestAnimationFrame(() => {
                    const ms = otpCode.expiry * 1000 - Date.now();
                    setPercentage(ms / (otpCode.period * 1000));
                    applyCountdown();
                });
            });

            applyCountdown();
        }
    }, [shareId, itemId, type]);

    /* if countdown has reached the 0 limit, trigger
     * a new OTP Code generation sequence */
    useEffect(() => {
        if (percentage < 0) {
            cancelAnimationFrame(requestAnimationRef.current);
            void doRequestOtpCodeGeneration();
        }
    }, [percentage, doRequestOtpCodeGeneration]);

    /* if any of the props change : clear the request
     * animation frame request and re-init state */
    useEffect(
        () => () => {
            setOtp(null);
            setPercentage(-1);
            cancelAnimationFrame(requestAnimationRef.current);
        },
        [shareId, itemId, type, totpUri]
    );

    return [otp, percentage];
};
