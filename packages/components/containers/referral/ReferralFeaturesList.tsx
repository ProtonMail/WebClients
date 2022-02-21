import { c } from 'ttag';
import { StrippedItem, StrippedList, Info } from '@proton/components';

const ReferralFeaturesList = () => (
    <StrippedList>
        <StrippedItem icon="servers">
            {c('Info').t`5 GB storage`}
            <Info className="ml0-5" title={c('Info').t`Storage space is shared across Mail, Calendar, and Drive.`} />
        </StrippedItem>
        <StrippedItem icon="envelope">
            {c('Info').t`5 email addresses/aliases`}
            <Info
                className="ml0-5"
                title={c('Info')
                    .t`Create multiple email addresses for your online identities, e.g., JohnShopper@proton.me for shopping accounts, JohnNews@proton.me for news subscriptions.`}
            />
        </StrippedItem>
        <StrippedItem icon="globe">
            {c('Info').t`Support for 1 custom email domain`}
            <Info
                className="ml0-5"
                title={c('Info').t`Use your own custom email domain addresses, e.g., you@yourname.com`}
            />
        </StrippedItem>
        <StrippedItem icon="paint-roller">{c('Info').t`Unlimited folders, labels, and filters`}</StrippedItem>
        <StrippedItem icon="grid">
            {c('Info').t`20 personal calendars`}
            <Info
                className="ml0-5"
                title={c('Info')
                    .t`Create up to 20 custom calendars. On top of that, add up to 5 calendars from friends, family, colleagues, and organizations.`}
            />
        </StrippedItem>
        <StrippedItem icon="shield">{c('Info').t`Free VPN on a single device`}</StrippedItem>
    </StrippedList>
);

export default ReferralFeaturesList;
