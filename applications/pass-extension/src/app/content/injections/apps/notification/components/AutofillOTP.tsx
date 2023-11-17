import { type VFC, useCallback, useEffect } from 'react';

import { PauseListDropdown } from 'proton-pass-extension/app/content/injections/apps/common/PauseListDropdown';
import type { IFrameCloseOptions, IFrameMessage } from 'proton-pass-extension/app/content/types';
import { IFrameMessageType } from 'proton-pass-extension/app/content/types';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { OTPDonut } from '@proton/pass/components/Otp/OTPDonut';
import { OTPValue } from '@proton/pass/components/Otp/OTPValue';
import { usePeriodicOtpCode } from '@proton/pass/hooks/usePeriodicOtpCode';
import { contentScriptMessage, sendMessage } from '@proton/pass/lib/extension/message';
import { createTelemetryEvent } from '@proton/pass/lib/telemetry/event';
import type { OtpRequest } from '@proton/pass/types';
import { type SelectedItem, WorkerMessageType } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';

import { NotificationHeader } from './NotificationHeader';

type Props = {
    hostname: string;
    item: SelectedItem;
    visible?: boolean;
    onMessage?: (message: IFrameMessage) => void;
    onClose?: (options?: IFrameCloseOptions) => void;
};

export const AutofillOTP: VFC<Props> = ({ hostname, item, visible, onMessage, onClose }) => {
    const [otp, percent] = usePeriodicOtpCode({
        generate: useCallback(
            (payload: OtpRequest) =>
                sendMessage.on(
                    contentScriptMessage({ type: WorkerMessageType.OTP_CODE_GENERATE, payload }),
                    (response) => (response.type === 'success' ? response : null)
                ),
            []
        ),
        payload: { ...item, type: 'item' },
    });

    useEffect(() => {
        void sendMessage(
            contentScriptMessage({
                type: WorkerMessageType.TELEMETRY_EVENT,
                payload: {
                    event: createTelemetryEvent(TelemetryEventName.TwoFADisplay, {}, {}),
                },
            })
        );
    }, []);

    return (
        <div className="flex flex-column flex-nowrap flex-justify-space-between h-full">
            <NotificationHeader
                title={c('Info').t`Verification code`}
                extra={
                    <PauseListDropdown
                        criteria="Autofill2FA"
                        hostname={hostname}
                        label={c('Action').t`Do not show on this website`}
                        onClose={onClose}
                        visible={visible}
                    />
                }
                onClose={onClose}
            />
            <div className="max-w-full">
                <div className="flex flex-nowrap flex-align-items-center flex-justify-center mb-2 gap-4">
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
            <div className="flex flex-justify-space-between gap-3">
                <Button
                    pill
                    color="norm"
                    type="submit"
                    className="flex-item-fluid-auto"
                    onClick={() => {
                        if (otp?.token) {
                            onMessage?.({
                                type: IFrameMessageType.NOTIFICATION_AUTOFILL_OTP,
                                payload: { code: otp.token },
                            });
                            onClose?.();
                        }
                    }}
                >
                    {c('Action').t`Copy & fill in`}
                </Button>
            </div>
        </div>
    );
};
