import { type FC, useRef } from 'react';

import { c } from 'ttag';

import type { IconName } from '@proton/icons/types';

import { useOTPCode } from '../../../../hooks/useOTPCode';
import type { MaybeNull, OtpRequest } from '../../../../types';
import { OTPDonut } from '../../../Otp/OTPDonut';
import { OTPValue } from '../../../Otp/OTPValue';
import type { IOtpRenderer } from '../../../Otp/types';
import { ValueControl } from './ValueControl';

type Props = { label?: string; payload: OtpRequest; onCopy?: () => void; icon?: IconName };

export const OTPValueControl: FC<Props> = ({ label, icon, payload, onCopy }) => {
    const otpRenderer = useRef<MaybeNull<IOtpRenderer>>(null);
    const otpToken = useOTPCode(payload, otpRenderer);

    return (
        <ValueControl
            clickToCopy
            icon={icon}
            value={otpToken ?? ''}
            label={label ?? c('Label').t`2FA token (TOTP)`}
            actions={<OTPDonut ref={otpRenderer} enabled={Boolean(otpToken)} />}
            onCopy={onCopy}
        >
            <OTPValue code={otpToken} />
        </ValueControl>
    );
};
