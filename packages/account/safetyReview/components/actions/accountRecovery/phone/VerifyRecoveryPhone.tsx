import { useState } from 'react';

import { c } from 'ttag';

import FormattedPhoneValue from '@proton/components/components/v2/phone/LazyFormattedPhoneValue';
import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import useLoading from '@proton/hooks/useLoading';

import { useUserSettings } from '../../../../../userSettings/hooks';
import type { ExtractRecoveryActionItem } from '../../../../recoveryState/recoveryState';
import { SafetyReviewCta } from '../../../SafetyReviewCta';
import darkPaperplaneIllustration from '../../../assets/paperplane-dark.svg';
import paperplaneIllustration from '../../../assets/paperplane.svg';
import { SafetyReviewCardHeader } from '../../../cards/SafetyReviewCardHeader';
import type { SafetyReviewAllProps } from '../../../interface';
import { VerifyRecoveryMethod } from '../verify/VerifyRecoveryMethod';
import { SendCodeToVerifyPhone } from './SendCodeToVerifyPhone';

type Props = SafetyReviewAllProps & {
    recoveryItem: ExtractRecoveryActionItem<'verifyRecoveryPhone'>;
};

export const VerifyRecoveryPhone = (props: Props) => {
    const [userSettings] = useUserSettings();
    const theme = useTheme();
    const isDarkTheme = theme.information.dark;
    const formattedPhoneNumber = <FormattedPhoneValue value={userSettings.Phone.Value} />;
    const boldPhoneNumber = <b key="phone-number">{formattedPhoneNumber}</b>;
    const [loading, withLoading] = useLoading();

    // Only send verify code immediately if the recovery phone was set in a previous step.
    const [shouldSendVerifyCode, setShouldSendVerifyCode] = useState(() => {
        // NOTE: Even though this card may be rendered in the background and would technically pick up a stale value, we abuse
        // the fact that the 'verifyRecoveryPhone' is added dynamically after 'setRecoveryPhone' has completed, which
        // will correctly let this card render with a populated actionsHistoryMap .
        return props.safetyReview.state.actionsHistoryMap.get('setRecoveryPhone')?.type === 'completed';
    });

    if (!shouldSendVerifyCode) {
        return (
            <SendCodeToVerifyPhone
                {...props}
                onUpdate={() => {}}
                onSkip={() => {
                    props.safetyReview.actions.next('skipped', props.recoveryItem);
                }}
                onSendCode={() => {
                    setShouldSendVerifyCode(true);
                }}
            />
        );
    }

    return (
        <>
            <SafetyReviewCardHeader>
                <SafetyReviewCardHeader.Illustration>
                    <img
                        src={isDarkTheme ? darkPaperplaneIllustration : paperplaneIllustration}
                        alt=""
                        width={80}
                        height={64}
                    />
                </SafetyReviewCardHeader.Illustration>
                <SafetyReviewCardHeader.Title>{c('safety_review')
                    .t`Verify your recovery phone`}</SafetyReviewCardHeader.Title>
                <SafetyReviewCardHeader.Description>
                    {c('safety_review')
                        .jt`To make sure the phone number is yours, enter the verification code sent to ${boldPhoneNumber}.`}
                </SafetyReviewCardHeader.Description>
            </SafetyReviewCardHeader>
            <VerifyRecoveryMethod
                {...props}
                loading={loading}
                withLoading={withLoading}
                onSuccess={() => {
                    props.safetyReview.actions.next('completed', props.recoveryItem);
                }}
                onError={(error) => {
                    // eslint-disable-next-line no-console
                    console.error(error);
                }}
                value={userSettings.Phone.Value}
                method="phone"
            />
            <SafetyReviewCta {...props} cta={c('safety_review').t`Verify`} />
        </>
    );
};
