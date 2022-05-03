import { c } from 'ttag';
import { StrippedItem, StrippedList, Info, Icon } from '@proton/components';
import { CALENDAR_APP_NAME, DRIVE_APP_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';

const ReferralFeaturesList = () => {
    const storageSize = humanSize(5 * 1024 ** 3, undefined, undefined, 0);
    return (
        <StrippedList>
            <StrippedItem left={<Icon className="color-success" name="lock" size={20} />}>
                {c('Info').t`${storageSize} storage`}
                <Info
                    className="ml0-5"
                    title={c('Info')
                        .t`Storage space is shared across ${MAIL_APP_NAME}, ${CALENDAR_APP_NAME}, and ${DRIVE_APP_NAME}.`}
                />
            </StrippedItem>
            <StrippedItem left={<Icon className="color-success" name="inbox" size={20} />}>
                {c('Info').t`5 email addresses`}
            </StrippedItem>
            <StrippedItem left={<Icon className="color-success" name="folders" size={20} />}>
                {c('Info').t`Unlimited folders, labels, and filters`}
            </StrippedItem>
            <StrippedItem left={<Icon className="color-success" name="envelopes" size={20} />}>
                {c('Info').t`Unlimited messages`}
            </StrippedItem>
            <StrippedItem left={<Icon className="color-success" name="speech-bubble" size={20} />}>
                {c('Info').t`Support for 1 custom email domain`}
            </StrippedItem>
            <StrippedItem left={<Icon className="color-success" name="life-ring" size={20} />}>
                {c('Info').t`Priority support`}
            </StrippedItem>
            <StrippedItem left={<Icon className="color-success" name="brand-proton-calendar" size={20} />}>
                {CALENDAR_APP_NAME}
            </StrippedItem>
        </StrippedList>
    );
};

export default ReferralFeaturesList;
