import { c, msgid } from 'ttag';

import Icon from '@proton/components/components/icon/Icon';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import type { Member, Organization } from '@proton/shared/lib/interfaces';

interface Props {
    member: Member;
    organization?: Organization;
}

const MemberFeatures = ({ member, organization }: Props) => {
    const { UsedSpace, MaxSpace, MaxVPN } = member;

    return (
        <>
            {(organization?.MaxSpace || 0) > 0 ? (
                <span className="mb-2 flex flex-nowrap">
                    <span className="shrink-0 flex mt-0.5">
                        <Icon name="filing-cabinet" />
                    </span>
                    <span className="flex-1 pl-1" data-testid="users-and-addresses-table:storage">
                        {humanSize({ bytes: UsedSpace, unit: 'GB' })} / {humanSize({ bytes: MaxSpace, unit: 'GB' })}
                    </span>
                </span>
            ) : null}
            {(organization?.MaxVPN || 0) > 0 ? (
                <span className="flex flex-nowrap">
                    <span className="shrink-0 flex mt-0.5">
                        <Icon name="brand-proton-vpn" />
                    </span>
                    <span className="flex-1 pl-1" data-testid="users-and-addresses-table:vpnConnections">
                        {c('Feature').ngettext(msgid`${MaxVPN} VPN connection`, `${MaxVPN} VPN connections`, MaxVPN)}
                    </span>
                </span>
            ) : null}
        </>
    );
};

export default MemberFeatures;
