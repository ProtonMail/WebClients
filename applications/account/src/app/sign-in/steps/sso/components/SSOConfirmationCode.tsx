import { c } from 'ttag';

import { getDisplayedAuthDeviceConfirmationCode } from '@proton/shared/lib/keys/device';

import type { SSODataTypes } from '../../../auth/interface';

interface Props {
    ssoData: SSODataTypes | undefined;
}

const SSOConfirmationCode = ({ ssoData }: Props) => {
    const code = (() => {
        if (ssoData && ssoData.type && ssoData.type !== 'set-password') {
            return getDisplayedAuthDeviceConfirmationCode(ssoData.deviceData).split('');
        }
        return [];
    })();

    return (
        <div className="border rounded border-primary flex items-center align-center gap-2 flex-column px-4 py-6">
            <div className="color-primary text-sm">{c('sso').t`Confirmation code`}</div>
            <div
                data-testid="sso:confirmation-code"
                className="flex gap-2 flex-nowrap text-monospace color-primary text-bold text-lg"
            >
                {code.map((code, index) => {
                    return (
                        <div className="rounded bg-norm-weak px-4 py-4" key={index}>
                            {code}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SSOConfirmationCode;
