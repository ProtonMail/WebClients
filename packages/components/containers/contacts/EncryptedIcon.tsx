import { c } from 'ttag';

import { Icon, Tooltip } from '../../components';

const EncryptedIcon = ({ ...rest }) => {
    return (
        <Tooltip title={c('Tooltip').t`Encrypted data with verified digital signature`}>
            <Icon name="lock-filled" className="flex flex-item-centered" {...rest} />
        </Tooltip>
    );
};

export default EncryptedIcon;
