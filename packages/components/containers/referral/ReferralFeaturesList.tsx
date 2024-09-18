import { c } from 'ttag';

import { StripedItem, StripedList } from '@proton/components';
import Icon from '@proton/components/components/icon/Icon';
import Info from '@proton/components/components/link/Info';
import { CALENDAR_APP_NAME, DRIVE_APP_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';

export const ReferralFeaturesList = () => {
    const storageSize = humanSize({ bytes: 15 * 1024 ** 3, fraction: 0 });
    return (
        <StripedList>
            <StripedItem left={<Icon className="color-success" name="storage" size={5} />}>
                {c('bf2023: Deal details').t`${storageSize} storage`}
                <Info
                    className="ml-2"
                    title={c('Info')
                        .t`Storage space is shared across ${MAIL_APP_NAME}, ${CALENDAR_APP_NAME}, and ${DRIVE_APP_NAME}.`}
                />
            </StripedItem>
            <StripedItem left={<Icon className="color-success" name="envelope" size={5} />}>
                {c('Info').t`10 email addresses`}
            </StripedItem>
            <StripedItem left={<Icon className="color-success" name="tag" size={5} />}>
                {c('Info').t`Unlimited folders, labels, and filters`}
            </StripedItem>
            <StripedItem left={<Icon className="color-success" name="paper-plane" size={5} />}>
                {c('Info').t`Unlimited messages`}
            </StripedItem>
            <StripedItem left={<Icon className="color-success" name="globe" size={5} />}>
                {c('Info').t`Support for 1 custom email domain`}
            </StripedItem>
            <StripedItem left={<Icon className="color-success" name="life-ring" size={5} />}>
                {c('Info').t`Priority support`}
            </StripedItem>
            <StripedItem left={<Icon className="color-success" name="brand-proton-calendar" size={5} />}>
                {CALENDAR_APP_NAME}
            </StripedItem>
        </StripedList>
    );
};
