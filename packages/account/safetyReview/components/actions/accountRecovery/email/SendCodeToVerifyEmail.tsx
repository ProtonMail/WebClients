import { useState } from 'react';

import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { useTheme } from '@proton/components/containers/themes/ThemeProvider';

import type { ExtractRecoveryActionItem } from '../../../../recoveryState/recoveryState';
import { SafetyReviewCta } from '../../../SafetyReviewCta';
import darkRecoveryEmailIllustration from '../../../assets/recovery-email-dark.svg';
import recoveryEmailIllustration from '../../../assets/recovery-email.svg';
import { SafetyReviewCardHeader } from '../../../cards/SafetyReviewCardHeader';
import type { SafetyReviewAllProps } from '../../../interface';
import { UpdateRecoveryEmail } from './UpdateRecoveryEmail';

type Props = SafetyReviewAllProps & {
    recoveryItem: ExtractRecoveryActionItem<'verifyRecoveryEmail'>;
    onSkip: () => void;
    onSendCode: () => void;
    onUpdate: () => void;
};
export const SendCodeToVerifyEmail = (props: Props) => {
    const theme = useTheme();
    const isDarkTheme = theme.information.dark;

    const [updateRecoveryEmail, setShouldUpdateRecoveryEmail] = useState(false);

    const updateEmailLink = (
        <InlineLinkButton key="resend" onClick={() => setShouldUpdateRecoveryEmail(true)} className="mt-2">
            {c('Safety review').t`update it now`}
        </InlineLinkButton>
    );

    if (updateRecoveryEmail) {
        return (
            <UpdateRecoveryEmail
                {...props}
                onCompleted={props.onSendCode}
                onSkip={() => {
                    setShouldUpdateRecoveryEmail(false);
                }}
            />
        );
    }

    return (
        <form
            id={props.firstItemId}
            onSubmit={(event) => {
                event.preventDefault();
                props.onSendCode();
            }}
        >
            <SafetyReviewCardHeader>
                <SafetyReviewCardHeader.Illustration>
                    <img
                        src={isDarkTheme ? darkRecoveryEmailIllustration : recoveryEmailIllustration}
                        alt=""
                        width={64}
                        height={64}
                    />
                </SafetyReviewCardHeader.Illustration>
                <SafetyReviewCardHeader.Title>{c('safety_review')
                    .t`Verify recovery email`}</SafetyReviewCardHeader.Title>
                <SafetyReviewCardHeader.Description>
                    {c('safety_review')
                        .t`Verifying your email address increases your account security and allows additional options for recovery.`}
                </SafetyReviewCardHeader.Description>
            </SafetyReviewCardHeader>
            <div className="mb-8 p-6 rounded-lg bg-weak border text-semibold text-center text-lg">
                {props.recoveryItem.recoveryItem.data.value}
            </div>

            <div className="flex gap-8">
                <div>
                    {c('safety_review')
                        .t`To make sure this address is really yours, we’ll send an email with a verification code.`}
                </div>
                <div>{c('safety_review').jt`If your recovery email has changed, ${updateEmailLink}.`}</div>
            </div>
            <SafetyReviewCta {...props} onSkip={props.onSkip} cta={c('safety_review').t`Send verification code`} />
        </form>
    );
};
