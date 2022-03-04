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
        <div className="border rounded px2 py1-5 pt0-5 your-account-usage-container">
            <h3>
                <strong>{c('new_plans: Title').t`Your account's usage`}</strong>
            </h3>
            <StrippedList>
                <StrippedItem icon="check">
                    <span id="usedSpaceLabel" className="block">{c('new_plans: Label')
                        .t`${humanUsedSpace} of ${humanMaxSpace}`}</span>
                    <Meter className="mt1 mb1" aria-hidden="true" value={Math.ceil(percentage(MaxSpace, UsedSpace))} />
                </StrippedItem>
                <StrippedItem icon="check">
                    {c('new_plans: Subscription attribute').ngettext(
                        msgid`${MaxCalendars} personal calendar`,
                        `${MaxCalendars} calendars`,
                        MaxCalendars
                    )}
                </StrippedItem>
                <StrippedItem icon="check">{c('new_plans: Subscription attribute').t`File storage`}</StrippedItem>
                <StrippedItem icon="check">{c('new_plans: Subscription attribute').t`Access to VPN`}</StrippedItem>
            </StrippedList>
        </div>
    );
};

export default MemberPanel;
