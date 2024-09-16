import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';

import { vpnEnterpriseContactUrl } from './vpnEnterpriseContactUrl';

const VpnEnterpriseAction = ({ ...props }) => {
    return (
        <ButtonLike as="a" color="norm" href={vpnEnterpriseContactUrl} fullWidth {...props}>
            {c('Action').t`Get in touch`}
        </ButtonLike>
    );
};

export default VpnEnterpriseAction;
