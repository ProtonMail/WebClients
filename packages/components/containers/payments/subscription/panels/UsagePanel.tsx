import type { PropsWithChildren } from 'react';

import { c, msgid } from 'ttag';

import { useMember } from '@proton/account/member/hook';
import { IcBrandProtonVpn } from '@proton/icons/icons/IcBrandProtonVpn';
import { IcCalendarCheckmark } from '@proton/icons/icons/IcCalendarCheckmark';
import { IcEnvelope } from '@proton/icons/icons/IcEnvelope';
import { IcStorage } from '@proton/icons/icons/IcStorage';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import type { Address, Organization, UserModel } from '@proton/shared/lib/interfaces';
import type { Calendar } from '@proton/shared/lib/interfaces/calendar';
import isTruthy from '@proton/utils/isTruthy';
import percentage from '@proton/utils/percentage';

import Meter from '../../../../components/progress/Meter';
import StripedItem from '../../../../components/stripedList/StripedItem';
import { StripedList } from '../../../../components/stripedList/StripedList';
import type { PlanCardFeatureIcon } from '../../features/interface';
import { getHighSpeedVPNConnectionsText } from '../../features/vpn';
import Panel from './Panel';

interface Item {
    /** Stable key; the icon is a component so it cannot serve as one. */
    id: string;
    icon: PlanCardFeatureIcon;
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
            id: 'addresses',
            icon: IcEnvelope,
            text: c('Subscription attribute').ngettext(
                msgid`${UsedAddresses} address`,
                `${UsedAddresses} addresses`,
                UsedAddresses
            ),
        },
        UsedCalendars !== undefined && {
            id: 'calendars',
            icon: IcCalendarCheckmark,
            text: c('Subscription attribute').ngettext(
                msgid`${UsedCalendars} calendar`,
                `${UsedCalendars} calendars`,
                UsedCalendars
            ),
        },
        !!(member && member.MaxVPN > 0) && {
            id: 'vpn',
            icon: IcBrandProtonVpn,
            text: user.hasPaidVpn
                ? getHighSpeedVPNConnectionsText(member.MaxVPN || VPNConnections)
                : c('Subscription attribute').t`1 VPN connection`,
        },
    ];

    return (
        <Panel title={c('new_plans: Title').t`Your account's usage`} data-testid="your-account-usage">
            <StripedList>
                <StripedItem left={<IcStorage className="color-success" size={5} />}>
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
                        <StripedItem key={item.id} left={<item.icon className="color-success" size={5} />}>
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
