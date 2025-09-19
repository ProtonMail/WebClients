import type { MutableRefObject } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import type { IOtpRenderer } from '@proton/pass/components/Otp/types';
import type { Maybe, MaybeNull, MaybePromise, OtpCode, OtpRequest } from '@proton/pass/types';

import { useEnsureMounted } from './useEnsureMounted';

export type UsePeriodOtpCodeOptions = {
    /** defines how you want to resolve the OTP Code. In the case of the
     * extension we can leverage worker messaging. For the web-app, this
     * will use the OTP generation utilities in-place. */
    generate: (payload: OtpRequest) => MaybePromise<MaybeNull<OtpCode>>;
    payload: OtpRequest;
};

/** Frame-skipping rate to achieve no more than
 * 24fps for performance reasons. */
const REFRESH_RATE = 1000 / 24;

export const useOTPCode = (payload: OtpRequest, ref: MutableRefObject<MaybeNull<IOtpRenderer>>): Maybe<string> => {
    const core = usePassCore();
    const otpKey = payload.type === 'item' ? `${payload.item.shareId}-${payload.item.itemId}` : payload.totpUri;

    const [otp, setOtp] = useState<MaybeNull<OtpCode>>(null);
    const percentage = useRef<number>(0);
    const updatedAt = useRef<number>(0);

    const requestAnimationRef = useRef<number>(-1);
    const ensureMounted = useEnsureMounted();

    const { createNotification } = useNotifications();

    /* Only trigger the countdown if we have a valid
     * OTP code with a valid period - else do nothing */
    const doRequestOtpCodeGeneration = useCallback(async () => {
        cancelAnimationFrame(requestAnimationRef.current);
        updatedAt.current = 0;
        percentage.current = 0;

        ensureMounted((otpCode: MaybeNull<OtpCode>) => {
            setOtp(otpCode);

            if (otpCode === null) {
                return createNotification({
                    text: c('Error').t`Unable to generate an OTP code for this item`,
                    type: 'error',
                });
            }

            if (otpCode !== null && otpCode.period && otpCode.period > 0) {
                const applyCountdown = ensureMounted(() => {
                    requestAnimationRef.current = requestAnimationFrame((timestamp) => {
                        if (timestamp - updatedAt.current >= REFRESH_RATE) {
                            updatedAt.current = timestamp;
                            const ms = otpCode.expiry * 1000 - Date.now();
                            const next = ms / (otpCode.period * 1000);

                            if (next > 0) {
                                percentage.current = ms / (otpCode.period * 1000);
                                ref.current?.draw(percentage.current, otpCode.period);
                            } else {
                                void doRequestOtpCodeGeneration();
                                return;
                            }
                        }

                        applyCountdown();
                    });
                });

                applyCountdown();
            }
        })(await core.generateOTP(payload));
    }, []);

    /* if countdown has reached the 0 limit, trigger
     * a new OTP Code generation sequence. If any of the props
     * change : clear the request animation frame request and re-init stat */
    useEffect(() => {
        void doRequestOtpCodeGeneration();
        return () => {
            setOtp(null);
            percentage.current = 0;
            cancelAnimationFrame(requestAnimationRef.current);
        };
    }, [otpKey]);

    return useMemo(() => otp?.token, [otp]);
};
