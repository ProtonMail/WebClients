import { c } from 'ttag';

import Tooltip from '../tooltip/Tooltip';
import Icon from '../icon/Icon';

const EncryptedIcon = ({ ...rest }) => {
    return (
        <Tooltip title={c('Tooltip').t`Encrypted data with verified digital signature`}>
            <Icon name="lock" className="flex flex-item-centered" {...rest} />
        </Tooltip>
    );
};

export default EncryptedIcon;
