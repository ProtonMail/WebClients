import { PropsWithChildren } from 'react';

import { c, msgid } from 'ttag';

import humanSize from '@proton/shared/lib/helpers/humanSize';
import { Address, Organization, UserModel } from '@proton/shared/lib/interfaces';
import { Calendar } from '@proton/shared/lib/interfaces/calendar';
import isTruthy from '@proton/utils/isTruthy';
import percentage from '@proton/utils/percentage';

import { Icon, IconName, Meter, StripedItem, StripedList } from '../../../../components';
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

    if (UsedMembers <= 1) {
        return null;
    }

    const humanUsedSpace = humanSize(user.UsedSpace);
    const humanMaxSpace = humanSize(user.MaxSpace);
    const UsedAddresses = addresses?.length;
    const UsedCalendars = calendars?.length;
    const maxVpn = 10;

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
        {
            icon: 'brand-proton-vpn',
            text: user.hasPaidVpn
                ? c('Subscription attribute').ngettext(
                      msgid`${maxVpn} high-speed VPN connection`,
                      `${maxVpn} high-speed VPN connections`,
                      maxVpn
                  )
                : c('Subscription attribute').t`1 VPN connection`,
        },
    ];

    return (
        <Panel title={c('new_plans: Title').t`Your account's usage`}>
            <StripedList>
                <StripedItem left={<Icon className="color-success" name="storage" size={20} />}>
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
                            left={<Icon className="color-success" name={item.icon} size={20} />}
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
