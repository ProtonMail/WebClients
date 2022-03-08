import { c } from 'ttag';
import { StrippedItem, StrippedList, Info } from '@proton/components';

const ReferralFeaturesList = () => (
    <StrippedList>
        <StrippedItem icon="lock">
            {c('Info').t`5 GB storage`}
            <Info className="ml0-5" title={c('Info').t`Storage space is shared across Mail, Calendar, and Drive.`} />
        </StrippedItem>
        <StrippedItem icon="mailbox">{c('Info').t`5 email addresses`}</StrippedItem>
        <StrippedItem icon="folders">{c('Info').t`Unlimited folders, labels, and filters`}</StrippedItem>
        <StrippedItem icon="envelopes">{c('Info').t`Unlimited messages`}</StrippedItem>
        <StrippedItem icon="messages">{c('Info').t`Support for 1 custom email domain`}</StrippedItem>
        <StrippedItem icon="envelope-fast">{c('Info').t`Priority support`}</StrippedItem>
        <StrippedItem icon="brand-proton-calendar">{c('Info').t`Proton Calendar`}</StrippedItem>
    </StrippedList>
);

export default ReferralFeaturesList;
