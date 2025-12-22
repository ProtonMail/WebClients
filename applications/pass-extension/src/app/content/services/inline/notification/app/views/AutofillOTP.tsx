import { type FC, useMemo, useRef } from 'react';

import type { NotificationAction } from 'proton-pass-extension/app/content/constants.runtime';
import { InlinePortMessageType } from 'proton-pass-extension/app/content/services/inline/inline.messages';
import { NotificationHeader } from 'proton-pass-extension/app/content/services/inline/notification/app/components/NotificationHeader';
import type { NotificationRequest } from 'proton-pass-extension/app/content/services/inline/notification/notification.app';
import { useIFrameAppController, useIFrameAppState } from 'proton-pass-extension/lib/components/Inline/IFrameApp';
import { ListItem } from 'proton-pass-extension/lib/components/Inline/ListItem';
import { PauseListDropdown } from 'proton-pass-extension/lib/components/Inline/PauseListDropdown';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { OTPDonut } from '@proton/pass/components/Otp/OTPDonut';
import { OTPValue } from '@proton/pass/components/Otp/OTPValue';
import type { IOtpRenderer } from '@proton/pass/components/Otp/types';
import { useOTPCode } from '@proton/pass/hooks/useOTPCode';
import { useTelemetryEvent } from '@proton/pass/hooks/useTelemetryEvent';
import { getItemKey } from '@proton/pass/lib/items/item.utils';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import type { MaybeNull } from '@proton/pass/types/utils/index';
import type { OtpRequest } from '@proton/pass/types/worker/otp';

type Props = Extract<NotificationRequest, { action: NotificationAction.OTP }>;

export const AutofillOTP: FC<Props> = ({ item }) => {
    const { visible, domain } = useIFrameAppState();
    const controller = useIFrameAppController();

    const payload = useMemo((): OtpRequest => ({ type: 'item', item }), [item]);
    const otpRenderer = useRef<MaybeNull<IOtpRenderer>>(null);
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
            <div className="max-w-full border rounded-xl border-weak">
                <ListItem
                    key={getItemKey(item)}
                    title={item.name}
                    subTitle={item.userIdentifier}
                    icon={{ type: 'icon', icon: 'user', url: item.url }}
                    fakeButton
                />

                <div className="flex flex-nowrap items-center justify-space-between gap-4 px-3 pb-2">
                    <div className="text-4xl max-w-4/5 text-ellipsis">
                        <span className="text-4xl lh100">
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
                                type: InlinePortMessageType.AUTOFILL_OTP,
                                payload: { code: otpToken },
                            });
                            controller.close();
                        }
                    }}
                    disabled={!otpToken}
                >
                    <span className="text-ellipsis">{c('Action').t`Fill in`}</span>
                </Button>
            </div>
        </div>
    );
};
