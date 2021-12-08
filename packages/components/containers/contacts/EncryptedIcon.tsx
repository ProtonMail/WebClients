import { c } from 'ttag';

import { Icon, Tooltip } from '../../components';

interface Props {
    isSignatureVerified: boolean;
    className: string;
}
const EncryptedIcon = ({ isSignatureVerified, className = 'flex flex-item-centered' }: Props) => {
    const tooltipText = isSignatureVerified
        ? c('Tooltip').t`Encrypted data with verified digital signature`
        : c('Tooltip').t`Encrypted data`;
    return (
        <Tooltip title={tooltipText}>
            <Icon name="lock-filled" className={className} />
        </Tooltip>
    );
};

export default EncryptedIcon;
