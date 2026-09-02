import { c } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcLockCheckFilled } from '@proton/icons/icons/IcLockCheckFilled';
import { IcLockFilled } from '@proton/icons/icons/IcLockFilled';

interface Props {
    isSignatureVerified: boolean;
    className: string;
}
const EncryptedIcon = ({ isSignatureVerified, className = 'flex' }: Props) => {
    const tooltipText = isSignatureVerified
        ? c('Tooltip').t`Encrypted data with verified digital signature`
        : c('Tooltip').t`Encrypted data`;
    const LockIcon = isSignatureVerified ? IcLockCheckFilled : IcLockFilled;

    return (
        <Tooltip title={tooltipText}>
            <span className="flex">
                <LockIcon className={className} />
            </span>
        </Tooltip>
    );
};

export default EncryptedIcon;
