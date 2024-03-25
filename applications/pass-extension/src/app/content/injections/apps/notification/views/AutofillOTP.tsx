import { type FC, useEffect } from 'react';

import { useIFrameContext } from 'proton-pass-extension/app/content/injections/apps/components/IFrameApp';
import { PauseListDropdown } from 'proton-pass-extension/app/content/injections/apps/components/PauseListDropdown';
import { IFrameMessageType } from 'proton-pass-extension/app/content/types';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { OTPDonut } from '@proton/pass/components/Otp/OTPDonut';
import { OTPValue } from '@proton/pass/components/Otp/OTPValue';
import { usePeriodicOtpCode } from '@proton/pass/hooks/usePeriodicOtpCode';
import { createTelemetryEvent } from '@proton/pass/lib/telemetry/event';
import { type SelectedItem } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';

import { NotificationHeader } from '../components/NotificationHeader';

type Props = { hostname: string; item: SelectedItem };

export const AutofillOTP: FC<Props> = ({ hostname, item }) => {
    const { generateOTP, onTelemetry } = usePassCore();
    const { close, forwardMessage } = useIFrameContext();

    const [otp, percent] = usePeriodicOtpCode({
        generate: generateOTP,
        payload: { type: 'item', item },
    });

    useEffect(() => {
        onTelemetry(createTelemetryEvent(TelemetryEventName.TwoFADisplay, {}, {}));
    }, []);

    return (
        <div className="flex flex-column flex-nowrap justify-space-between h-full anime-fade-in">
            <NotificationHeader
                title={c('Info').t`Verification code`}
                extra={
                    <PauseListDropdown
                        criteria="Autofill2FA"
                        hostname={hostname}
                        label={c('Action').t`Do not show on this website`}
                    />
                }
            />
            <div className="max-w-full">
                <div className="flex flex-nowrap items-center justify-center mb-2 gap-4">
                    <div className="text-4xl max-w-4/5 text-ellipsis">
                        <span className="text-4xl">
                            <OTPValue code={otp?.token} />
                        </span>
                    </div>

                    <div className="h-custom w-custom" style={{ '--w-custom': '2rem', '--h-custom': '2rem' }}>
                        <OTPDonut enabled={otp !== null} percent={percent} period={otp?.period} />
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
                        if (otp?.token) {
                            forwardMessage({
                                type: IFrameMessageType.NOTIFICATION_AUTOFILL_OTP,
                                payload: { code: otp.token },
                            });
                            close();
                        }
                    }}
                >
                    <span className="text-ellipsis">{c('Action').t`Copy & fill in`}</span>
                </Button>
            </div>
        </div>
    );
};
