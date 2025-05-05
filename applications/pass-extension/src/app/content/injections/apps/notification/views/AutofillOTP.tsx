import { type FC, useMemo, useRef } from 'react';

import {
    useIFrameAppController,
    useIFrameAppState,
} from 'proton-pass-extension/app/content/injections/apps/components/IFrameApp';
import { PauseListDropdown } from 'proton-pass-extension/app/content/injections/apps/components/PauseListDropdown';
import type { NotificationAction, NotificationActions } from 'proton-pass-extension/app/content/types';
import { IFramePortMessageType } from 'proton-pass-extension/app/content/types';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { OTPDonut } from '@proton/pass/components/Otp/OTPDonut';
import { OTPValue } from '@proton/pass/components/Otp/OTPValue';
import type { OTPRendererHandles } from '@proton/pass/components/Otp/types';
import { useOTPCode } from '@proton/pass/hooks/useOTPCode';
import { useTelemetryEvent } from '@proton/pass/hooks/useTelemetryEvent';
import type { MaybeNull, OtpRequest } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';

import { NotificationHeader } from '../components/NotificationHeader';

type Props = Extract<NotificationActions, { action: NotificationAction.OTP }>;

export const AutofillOTP: FC<Props> = ({ item }) => {
    const { visible, domain } = useIFrameAppState();
    const controller = useIFrameAppController();

    const payload = useMemo((): OtpRequest => ({ type: 'item', item }), [item]);
    const otpRenderer = useRef<MaybeNull<OTPRendererHandles>>(null);
    const otpToken = useOTPCode(payload, otpRenderer);

    useTelemetryEvent(TelemetryEventName.TwoFADisplay, {}, {})([visible]);

    return (
        <div className="flex flex-column flex-nowrap justify-space-between *:shrink-0 h-full anime-fade-in gap-3">
            <NotificationHeader
                title={c('Info').t`Verification code`}
                discardOnClose
                extra={
                    <PauseListDropdown
                        criteria="Autofill2FA"
                        hostname={domain}
                        label={c('Action').t`Do not show on this website`}
                    />
                }
            />
            <div className="max-w-full">
                <div className="flex flex-nowrap items-center justify-center gap-4">
                    <div className="text-4xl max-w-4/5 text-ellipsis">
                        <span className="text-4xl">
                            <OTPValue code={otpToken} />
                        </span>
                    </div>

                    <div className="h-custom w-custom" style={{ '--w-custom': '2rem', '--h-custom': '2rem' }}>
                        <OTPDonut enabled={Boolean(otpToken)} ref={otpRenderer} />
                    </div>
                </div>
            </div>
            <div className="flex justify-space-between gap-3">
                <Button
                    pill
                    color="norm"
                    type="submit"
                    className="flex-auto"
                    onClick={() => {
                        if (otpToken) {
                            controller.forwardMessage({
                                type: IFramePortMessageType.AUTOFILL_OTP,
                                payload: { code: otpToken },
                            });
                            controller.close();
                        }
                    }}
                >
                    <span className="text-ellipsis">{c('Action').t`Fill in`}</span>
                </Button>
            </div>
        </div>
    );
};
