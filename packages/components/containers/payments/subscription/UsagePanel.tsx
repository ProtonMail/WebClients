import { c, msgid } from 'ttag';
import { Address, Organization, UserModel } from '@proton/shared/lib/interfaces';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import percentage from '@proton/shared/lib/helpers/percentage';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { Calendar } from '@proton/shared/lib/interfaces/calendar';

import { StrippedList, StrippedItem, Meter, IconName } from '../../../components';

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

const UsagePanel = ({ addresses, calendars, organization, user }: Props) => {
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
        <div className="border rounded px2 py1-5 pt0-5 your-account-usage-container">
            <h3>
                <strong>{c('new_plans: Title').t`Your account's usage`}</strong>
            </h3>
            <StrippedList>
                <StrippedItem icon="storage">
                    <span id="usedSpaceLabel" className="block">{c('new_plans: Label')
                        .t`${humanUsedSpace} of ${humanMaxSpace}`}</span>
                    <Meter
                        className="mt1 mb1"
                        aria-hidden="true"
                        value={Math.ceil(percentage(user.MaxSpace, user.UsedSpace))}
                    />
                </StrippedItem>
                {items.filter(isTruthy).map((item) => {
                    return (
                        <StrippedItem key={item.text} icon={item.icon}>
                            {item.text}
                        </StrippedItem>
                    );
                })}
            </StrippedList>
        </div>
    );
};

export default UsagePanel;
