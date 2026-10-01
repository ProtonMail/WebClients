import { c } from 'ttag';

import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { getDisplayedAuthDeviceConfirmationCode } from '@proton/shared/lib/keys/device';
import clsx from '@proton/utils/clsx';

import type { SSODataTypes } from '../../../auth/interface';

interface Props {
    ssoData: SSODataTypes | undefined;
    /** The request was approved: the code shows it, and stays for reference while the sign-in runs. */
    approved?: boolean;
}

const SSOConfirmationCode = ({ ssoData, approved = false }: Props) => {
    const code = (() => {
        if (ssoData && ssoData.type && ssoData.type !== 'set-password') {
            return getDisplayedAuthDeviceConfirmationCode(ssoData.deviceData).split('');
        }
        return [];
    })();

    return (
        <div
            className={clsx(
                'border rounded flex items-center align-center gap-2 flex-column px-4 py-6',
                approved ? 'border-success' : 'border-primary'
            )}
        >
            {approved ? (
                <div className="color-success text-sm flex items-center gap-1">
                    <IcCheckmarkCircleFilled size={4} />
                    {c('sso').t`Approved`}
                </div>
            ) : (
                <div className="color-primary text-sm">{c('sso').t`Confirmation code`}</div>
            )}
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
