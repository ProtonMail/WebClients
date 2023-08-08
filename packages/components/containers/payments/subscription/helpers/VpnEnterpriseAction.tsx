import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button';

const VpnEnterpriseAction = ({ ...props }) => {
    return (
        <ButtonLike as="a" color="norm" href="https://protonvpn.com/business/contact" fullWidth {...props}>
            {c('Action').t`Get in touch`}
        </ButtonLike>
    );
};

export default VpnEnterpriseAction;
