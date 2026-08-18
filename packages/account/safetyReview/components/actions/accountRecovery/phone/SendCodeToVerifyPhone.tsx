import { useState } from 'react';

import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { useTheme } from '@proton/components/containers/themes/ThemeProvider';

import type { ExtractRecoveryActionItem } from '../../../../recoveryState/recoveryState';
import { SafetyReviewCta } from '../../../SafetyReviewCta';
import darkRecoveryPhoneIllustration from '../../../assets/recovery-phone-dark.svg';
import recoveryPhoneIllustration from '../../../assets/recovery-phone.svg';
import { SafetyReviewCardHeader } from '../../../cards/SafetyReviewCardHeader';
import type { SafetyReviewAllProps } from '../../../interface';
import { UpdateRecoveryPhone } from './UpdateRecoveryPhone';

type Props = SafetyReviewAllProps & {
    recoveryItem: ExtractRecoveryActionItem<'verifyRecoveryPhone'>;
    onSkip: () => void;
    onSendCode: () => void;
    onUpdate: () => void;
};
export const SendCodeToVerifyPhone = (props: Props) => {
    const theme = useTheme();
    const isDarkTheme = theme.information.dark;

    const [updateRecoveryPhone, setShouldUpdateRecoveryPhone] = useState(false);

    const updatePhoneLink = (
        <InlineLinkButton key="resend" onClick={() => setShouldUpdateRecoveryPhone(true)} className="mt-2">
            {c('Safety review').t`update it now`}
        </InlineLinkButton>
    );

    if (updateRecoveryPhone) {
        return (
            <UpdateRecoveryPhone
                {...props}
                onCompleted={props.onSendCode}
                onSkip={() => {
                    setShouldUpdateRecoveryPhone(false);
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
                        src={isDarkTheme ? darkRecoveryPhoneIllustration : recoveryPhoneIllustration}
                        alt=""
                        width={64}
                        height={64}
                    />
                </SafetyReviewCardHeader.Illustration>
                <SafetyReviewCardHeader.Title>{c('safety_review')
                    .t`Verify recovery phone`}</SafetyReviewCardHeader.Title>
                <SafetyReviewCardHeader.Description>
                    {c('safety_review')
                        .t`Verifying your phone number increases your account security and allows additional options for recovery.`}
                </SafetyReviewCardHeader.Description>
            </SafetyReviewCardHeader>
            <div className="mb-8 p-6 rounded-lg bg-weak border text-semibold text-center text-lg">
                {props.recoveryItem.recoveryItem.data.value}
            </div>

            <div className="flex gap-8">
                <div>
                    {c('safety_review')
                        .t`To make sure this number is really yours, we’ll send an SMS with a verification code.`}
                </div>
                <div>{c('safety_review').jt`If your recovery phone has changed, ${updatePhoneLink}.`}</div>
            </div>
            <SafetyReviewCta {...props} onSkip={props.onSkip} cta={c('safety_review').t`Send verification code`} />
        </form>
    );
};
