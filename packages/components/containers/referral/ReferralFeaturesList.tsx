import { c } from 'ttag';
import { StrippedItem, StrippedList, Info } from '@proton/components';
import { CALENDAR_APP_NAME, DRIVE_APP_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';

const ReferralFeaturesList = () => {
    const storageSize = humanSize(5 * 1024 ** 3, undefined, undefined, 0);
    return (
        <StrippedList>
            <StrippedItem icon="lock">
                {c('Info').t`${storageSize} storage`}
                <Info
                    className="ml0-5"
                    title={c('Info')
                        .t`Storage space is shared across ${MAIL_APP_NAME}, ${CALENDAR_APP_NAME}, and ${DRIVE_APP_NAME}.`}
                />
            </StrippedItem>
            <StrippedItem icon="inbox">{c('Info').t`5 email addresses`}</StrippedItem>
            <StrippedItem icon="folders">{c('Info').t`Unlimited folders, labels, and filters`}</StrippedItem>
            <StrippedItem icon="envelopes">{c('Info').t`Unlimited messages`}</StrippedItem>
            <StrippedItem icon="speech-bubble">{c('Info').t`Support for 1 custom email domain`}</StrippedItem>
            <StrippedItem icon="life-ring">{c('Info').t`Priority support`}</StrippedItem>
            <StrippedItem icon="brand-proton-calendar">{CALENDAR_APP_NAME}</StrippedItem>
        </StrippedList>
    );
};

export default ReferralFeaturesList;
