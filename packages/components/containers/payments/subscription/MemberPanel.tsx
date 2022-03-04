import { c, msgid } from 'ttag';
import { Organization, UserModel } from '@proton/shared/lib/interfaces';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import percentage from '@proton/shared/lib/helpers/percentage';

import { MAX_CALENDARS_FREE, MAX_CALENDARS_PAID } from '@proton/shared/lib/constants';
import { StrippedList, StrippedItem, Meter } from '../../../components';

interface Props {
    organization?: Organization;
    user: UserModel;
}

const MemberPanel = ({ organization, user }: Props) => {
    const { UsedMembers = 0 } = organization || {};

    if (UsedMembers <= 1) {
        return null;
    }

    const { UsedSpace, MaxSpace, hasPaidMail } = user;
    const humanUsedSpace = humanSize(UsedSpace);
    const humanMaxSpace = humanSize(MaxSpace);
    const MaxCalendars = hasPaidMail ? MAX_CALENDARS_PAID : MAX_CALENDARS_FREE;

    return (
        <div className="border rounded px2 py1">
            <h3>{c('Title').t`Your account's usage`}</h3>
            <StrippedList>
                <StrippedItem icon="check">
                    <label id="usedSpaceLabel" className="block">{c('Label')
                        .t`${humanUsedSpace} of ${humanMaxSpace}`}</label>
                    <Meter
                        className="mt1"
                        aria-labelledby="usedSpaceLabel"
                        value={Math.ceil(percentage(MaxSpace, UsedSpace))}
                    />
                </StrippedItem>
                <StrippedItem icon="check">
                    {c('Subscription attribute').ngettext(
                        msgid`${MaxCalendars} personal calendar`,
                        `${MaxCalendars} calendars`,
                        MaxCalendars
                    )}
                </StrippedItem>
                <StrippedItem icon="check">{c('Subscription attribute').t`File storage`}</StrippedItem>
                <StrippedItem icon="check">{c('Subscription attribute').t`Access to VPN`}</StrippedItem>
            </StrippedList>
        </div>
    );
};

export default MemberPanel;
