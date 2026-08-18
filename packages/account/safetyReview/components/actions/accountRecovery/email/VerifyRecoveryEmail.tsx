import { useState } from 'react';

import { c } from 'ttag';

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
import { SendCodeToVerifyEmail } from './SendCodeToVerifyEmail';

type Props = SafetyReviewAllProps & {
    recoveryItem: ExtractRecoveryActionItem<'verifyRecoveryEmail'>;
};

export const VerifyRecoveryEmail = (props: Props) => {
    const [userSettings] = useUserSettings();
    const theme = useTheme();
    const isDarkTheme = theme.information.dark;
    const boldEmail = <b key="bold-email">{userSettings.Email.Value}</b>;
    const [loading, withLoading] = useLoading();
    // Only send verify code immediately if the recovery email was set in a previous step.
    const [shouldSendVerifyCode, setShouldSendVerifyCode] = useState(() => {
        // NOTE: Even though this card may be rendered in the background and would technically pick up a stale value, we abuse
        // the fact that the 'verifyRecoveryEmail' is added dynamically after 'setRecoveryEmail' has completed, which
        // will correctly let this card render with a populated actionsHistoryMap .
        return props.safetyReview.state.actionsHistoryMap.get('setRecoveryEmail')?.type === 'completed';
    });

    if (!shouldSendVerifyCode) {
        return (
            <SendCodeToVerifyEmail
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
                    .t`Verify your recovery email`}</SafetyReviewCardHeader.Title>
                <SafetyReviewCardHeader.Description>
                    {c('safety_review')
                        .jt`To make sure the email address is yours, enter the verification code sent to ${boldEmail}.`}
                </SafetyReviewCardHeader.Description>
            </SafetyReviewCardHeader>
            <VerifyRecoveryMethod
                {...props}
                withLoading={withLoading}
                loading={loading}
                onSuccess={() => {
                    props.safetyReview.actions.next('completed', props.recoveryItem);
                }}
                onError={(error) => {
                    // eslint-disable-next-line no-console
                    console.error(error);
                }}
                value={userSettings.Email.Value}
                method="email"
            />
            <SafetyReviewCta {...props} loading={loading} cta={c('safety_review').t`Verify`} />
        </>
    );
};
