import { DOMAIN_STATE, Domain } from '@proton/shared/lib/interfaces';

import { Icon } from '../../components';

const { DOMAIN_STATE_DEFAULT, DOMAIN_STATE_VERIFIED, DOMAIN_STATE_WARN } = DOMAIN_STATE;

export interface Props {
    domain: Domain;
}

const DomainName = ({ domain }: Props) => {
    const ICONS = {
        [DOMAIN_STATE_DEFAULT]: (
            <Icon className="color-danger flex-item-noshrink" type="error" name="cross-circle-filled" />
        ),
        [DOMAIN_STATE_VERIFIED]: <Icon className="color-success flex-item-noshrink" name="checkmark-circle-filled" />,
        [DOMAIN_STATE_WARN]: (
            <Icon className="color-warning flex-item-noshrink" type="warning" name="cross-circle-filled" />
        ),
    };

    return (
        <span className="flex flex-nowrap items-center">
            {ICONS[domain.State]}
            <span className="text-ellipsis ml-2" title={domain.DomainName}>
                {domain.DomainName}
            </span>
        </span>
    );
};

export default DomainName;
