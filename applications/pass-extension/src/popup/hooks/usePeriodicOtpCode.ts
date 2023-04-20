import { useCallback, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { popupMessage, sendMessage } from '@proton/pass/extension/message';
import type { MaybeNull, OtpCode, SelectedItem } from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';

export type Props = SelectedItem & { totpUri: string };

const requestOtpCodeGeneration = async ({ shareId, itemId }: SelectedItem): Promise<MaybeNull<OtpCode>> =>
    sendMessage.map(
        popupMessage({
            type: WorkerMessageType.OTP_CODE_GENERATE,
            payload: { shareId, itemId },
        }),
        (response) => (response.type === 'success' ? response : null)
    );

export const usePeriodicOtpCode = ({ shareId, itemId, totpUri }: Props): [MaybeNull<OtpCode>, number] => {
    const [otp, setOtp] = useState<MaybeNull<OtpCode>>(null);
    const [percentage, setPercentage] = useState<number>(-1);
    const requestAnimationRef = useRef<number>(-1);

    const { createNotification } = useNotifications();

    /* Only trigger the countdown if we have a valid
     * OTP code with a valid period - else do nothing */
    const doRequestOtpCodeGeneration = useCallback(async () => {
        const otpCode = await requestOtpCodeGeneration({ shareId, itemId });
        setOtp(otpCode);

        if (otpCode === null) {
            return createNotification({
                text: c('Error').t`Unable to generate an OTP code for this item`,
                type: 'error',
            });
        }

        if (otpCode !== null && otpCode.period && otpCode.period > 0) {
            const applyCountdown = () => {
                requestAnimationRef.current = requestAnimationFrame(() => {
                    const ms = otpCode.expiry * 1000 - Date.now();
                    setPercentage(ms / (otpCode.period * 1000));
                    applyCountdown();
                });
            };

            applyCountdown();
        }
    }, [shareId, itemId]);

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
            cancelAnimationFrame(requestAnimationRef.current);
            setOtp(null);
            setPercentage(0);
        },
        [itemId, shareId, totpUri]
    );

    return [otp, percentage];
};
