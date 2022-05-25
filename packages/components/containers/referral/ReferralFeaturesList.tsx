import { c } from 'ttag';
import { StripedItem, StripedList, Info, Icon } from '@proton/components';
import { CALENDAR_APP_NAME, DRIVE_APP_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';

const ReferralFeaturesList = () => {
    const storageSize = humanSize(15 * 1024 ** 3, undefined, undefined, 0);
    return (
        <StripedList>
            <StripedItem left={<Icon className="color-success" name="storage" size={20} />}>
                {c('Info').t`${storageSize} storage`}
                <Info
                    className="ml0-5"
                    title={c('Info')
                        .t`Storage space is shared across ${MAIL_APP_NAME}, ${CALENDAR_APP_NAME}, and ${DRIVE_APP_NAME}.`}
                />
            </StripedItem>
            <StripedItem left={<Icon className="color-success" name="envelope" size={20} />}>
                {c('Info').t`10 email addresses`}
            </StripedItem>
            <StripedItem left={<Icon className="color-success" name="tag" size={20} />}>
                {c('Info').t`Unlimited folders, labels, and filters`}
            </StripedItem>
            <StripedItem left={<Icon className="color-success" name="paper-plane" size={20} />}>
                {c('Info').t`Unlimited messages`}
            </StripedItem>
            <StripedItem left={<Icon className="color-success" name="globe" size={20} />}>
                {c('Info').t`Support for 1 custom email domain`}
            </StripedItem>
            <StripedItem left={<Icon className="color-success" name="life-ring" size={20} />}>
                {c('Info').t`Priority support`}
            </StripedItem>
            <StripedItem left={<Icon className="color-success" name="brand-proton-calendar" size={20} />}>
                {CALENDAR_APP_NAME}
            </StripedItem>
        </StripedList>
    );
};

export default ReferralFeaturesList;
