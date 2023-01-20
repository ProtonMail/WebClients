import { DOMAIN_STATE } from '@proton/shared/lib/constants';
import { Domain } from '@proton/shared/lib/interfaces';

import { Icon } from '../../components';

const { DOMAIN_STATE_DEFAULT, DOMAIN_STATE_ACTIVE, DOMAIN_STATE_WARN } = DOMAIN_STATE;

export interface Props {
    domain: Domain;
}

const DomainName = ({ domain }: Props) => {
    const ICONS = {
        [DOMAIN_STATE_DEFAULT]: (
            <Icon className="color-danger flex-item-noshrink" type="error" name="cross-circle-filled" />
        ),
        [DOMAIN_STATE_ACTIVE]: <Icon className="color-success flex-item-noshrink" name="checkmark-circle-filled" />,
        [DOMAIN_STATE_WARN]: (
            <Icon className="color-warning flex-item-noshrink" type="warning" name="cross-circle-filled" />
        ),
    };

    return (
        <span className="flex flex-nowrap flex-align-items-center">
            {ICONS[domain.State as DOMAIN_STATE]}
            <span className="text-ellipsis ml0-5" title={domain.DomainName}>
                {domain.DomainName}
            </span>
        </span>
    );
};

export default DomainName;
