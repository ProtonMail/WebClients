import { type FC, useRef } from 'react';

import { c } from 'ttag';

import type { IconName } from '@proton/components';
import { OTPDonut } from '@proton/pass/components/Otp/OTPDonut';
import { OTPValue } from '@proton/pass/components/Otp/OTPValue';
import type { OTPRendererHandles } from '@proton/pass/components/Otp/types';
import { useOTPCode } from '@proton/pass/hooks/useOTPCode';
import type { MaybeNull } from '@proton/pass/types';
import type { OtpRequest } from '@proton/pass/types';

import { ValueControl } from './ValueControl';

type Props = { label?: string; payload: OtpRequest; onCopy?: () => void; icon?: IconName };

export const OTPValueControl: FC<Props> = ({ label, icon, payload, onCopy }) => {
    const otpRenderer = useRef<MaybeNull<OTPRendererHandles>>(null);
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
