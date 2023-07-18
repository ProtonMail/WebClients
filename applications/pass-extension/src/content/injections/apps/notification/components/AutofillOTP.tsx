import { type VFC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import type { SelectedItem } from '@proton/pass/types';

import { OTPDonut } from '../../../../../shared/components/otp/OTPDonut';
import { OTPValue } from '../../../../../shared/components/otp/OTPValue';
import { usePeriodicOtpCode } from '../../../../../shared/hooks/usePeriodicOtpCode';
import type { IFrameCloseOptions } from '../../../../types';
import { type IFrameMessage, IFrameMessageType } from '../../../../types';
import { NotificationHeader } from './NotificationHeader';

type Props = {
    item: SelectedItem;
    onMessage?: (message: IFrameMessage) => void;
    onClose?: (options?: IFrameCloseOptions) => void;
};

export const AutofillOTP: VFC<Props> = ({ item, onMessage, onClose }) => {
    const [otp, percent] = usePeriodicOtpCode({ ...item, type: 'item' });

    return (
        <div className="flex flex-column h100 flex-justify-space-between">
            <NotificationHeader title={c('Info').t`Verification code`} onClose={onClose} />
            <div className="max-w100">
                <div className="flex flex-nowrap flex-align-items-center flex-justify-center mb-2 gap-4">
                    <div className="text-4xl max-w80 text-ellipsis">
                        <span className="text-4xl">
                            <OTPValue code={otp?.token} />
                        </span>
                    </div>

                    <div className="h-custom w-custom" style={{ '--w-custom': '32px', '--h-custom': '32px' }}>
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
