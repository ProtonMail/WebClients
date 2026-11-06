import { type FC, useRef } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import type { IconComponent } from '@proton/icons/component';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { useOTPCode } from '../../../../hooks/useOTPCode';
import { selectOrgTOTPDisabled } from '../../../../store/selectors/organization';
import type { MaybeNull } from '../../../../types/utils';
import type { OtpRequest } from '../../../../types/worker/otp';
import { OrganizationPolicyTooltip } from '../../../Organization/OrganizationPolicyTooltip';
import { OTPDonut } from '../../../Otp/OTPDonut';
import { OTPValue } from '../../../Otp/OTPValue';
import type { IOtpRenderer } from '../../../Otp/types';
import { ValueControl } from './ValueControl';

type Props = { label?: string; payload: OtpRequest; onCopy?: () => void; icon?: IconComponent };

const OTPCodeControl: FC<Props> = ({ label, icon, payload, onCopy }) => {
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

export const OTPValueControl: FC<Props> = (props) => {
    const orgTOTPDisabled = useSelector(selectOrgTOTPDisabled);

    return orgTOTPDisabled ? (
        <OrganizationPolicyTooltip
            enforced
            text={c('Info').t`Your organization does not allow using 2FA codes stored in ${PASS_APP_NAME}`}
        >
            <ValueControl disabled icon={props.icon} label={props.label ?? c('Label').t`2FA token (TOTP)`}>
                <span className="color-weak">{c('Info').t`Disabled by your organization`}</span>
            </ValueControl>
        </OrganizationPolicyTooltip>
    ) : (
        <OTPCodeControl {...props} />
    );
};
