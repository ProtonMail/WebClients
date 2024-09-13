import type { PropsWithChildren } from 'react';

import { c, msgid } from 'ttag';

import { StripedItem, StripedList } from '@proton/components';
import Meter from '@proton/components/components/progress/Meter';
import { getHighSpeedVPNConnectionsText } from '@proton/components/containers/payments/features/vpn';
import { useMember } from '@proton/components/hooks';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import type { Address, Organization, UserModel } from '@proton/shared/lib/interfaces';
import type { Calendar } from '@proton/shared/lib/interfaces/calendar';
import isTruthy from '@proton/utils/isTruthy';
import percentage from '@proton/utils/percentage';

import type { IconName } from '../../../../components';
import { Icon } from '../../../../components';
import Panel from './Panel';

interface Item {
    icon: IconName;
    text: string;
}

interface Props {
    organization?: Organization;
    user: UserModel;
    addresses?: Address[];
    calendars?: Calendar[];
}

const UsagePanel = ({ addresses, calendars, organization, user, children }: PropsWithChildren<Props>) => {
    const { UsedMembers = 0 } = organization || {};
    const [member] = useMember();

    if (UsedMembers <= 1) {
        return null;
    }

    const humanUsedSpace = humanSize({ bytes: user.UsedSpace });
    const humanMaxSpace = humanSize({ bytes: user.MaxSpace });
    const UsedAddresses = addresses?.length;
    const UsedCalendars = calendars?.length;
    const VPNConnections = 10;

    const items: (Item | false)[] = [
        UsedAddresses !== undefined && {
            icon: 'envelope',
            text: c('Subscription attribute').ngettext(
                msgid`${UsedAddresses} address`,
                `${UsedAddresses} addresses`,
                UsedAddresses
            ),
        },
        UsedCalendars !== undefined && {
            icon: 'calendar-checkmark',
            text: c('Subscription attribute').ngettext(
                msgid`${UsedCalendars} calendar`,
                `${UsedCalendars} calendars`,
                UsedCalendars
            ),
        },
        !!(member && member.MaxVPN > 0) && {
            icon: 'brand-proton-vpn',
            text: user.hasPaidVpn
                ? getHighSpeedVPNConnectionsText(member.MaxVPN || VPNConnections)
                : c('Subscription attribute').t`1 VPN connection`,
        },
    ];

    return (
        <Panel title={c('new_plans: Title').t`Your account's usage`} data-testid="your-account-usage">
            <StripedList>
                <StripedItem left={<Icon className="color-success" name="storage" size={5} />}>
                    <span id="usedSpaceLabel" className="block">{c('new_plans: Label')
                        .t`${humanUsedSpace} of ${humanMaxSpace}`}</span>
                    <Meter
                        className="my-4"
                        aria-hidden="true"
                        value={Math.ceil(percentage(user.MaxSpace, user.UsedSpace))}
                    />
                </StripedItem>
                {items.filter(isTruthy).map((item) => {
                    return (
                        <StripedItem
                            key={item.icon}
                            left={<Icon className="color-success" name={item.icon} size={5} />}
                        >
                            {item.text}
                        </StripedItem>
                    );
                })}
            </StripedList>
            {children}
        </Panel>
    );
};

export default UsagePanel;
