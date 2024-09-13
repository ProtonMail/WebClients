import { c } from 'ttag';

import Icon from '@proton/components/components/icon/Icon';

import { Tooltip } from '../../../components';

interface Props {
    isSignatureVerified: boolean;
    className: string;
}
const EncryptedIcon = ({ isSignatureVerified, className = 'flex' }: Props) => {
    const tooltipText = isSignatureVerified
        ? c('Tooltip').t`Encrypted data with verified digital signature`
        : c('Tooltip').t`Encrypted data`;
    const iconName = isSignatureVerified ? 'lock-check-filled' : 'lock-filled';

    return (
        <Tooltip title={tooltipText}>
            <Icon name={iconName} className={className} />
        </Tooltip>
    );
};

export default EncryptedIcon;
