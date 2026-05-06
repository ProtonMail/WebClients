import { c } from 'ttag';

import { SafetyReviewCta } from '@proton/account/safetyReview/components/SafetyReviewCta';
import { VerifyRecoveryMethod } from '@proton/account/safetyReview/components/actions/accountRecovery/verify/VerifyRecoveryMethod';
import type { SafetyReviewAllProps } from '@proton/account/safetyReview/components/interface';
import type { ExtractRecoveryActionItem } from '@proton/account/safetyReview/recoveryState/recoveryState';
import { useRecoverySettingsTelemetry } from '@proton/components/containers/recovery/recoverySettingsTelemetry';
import useLoading from '@proton/hooks/useLoading';

import paperplaneIllustration from '../../../assets/paperplane.svg';
import { SafetyReviewCardHeader } from '../../../cards/SafetyReviewCardHeader';

type Props = SafetyReviewAllProps & {
    recoveryItem: ExtractRecoveryActionItem<'verifyRecoveryEmail'>;
};

export const VerifyRecoveryEmail = (props: Props) => {
    const boldEmail = <b key="bold-email">{props.recoveryItem.recoveryItem.data.value}</b>;
    const { sendRecoverySettingEnabled } = useRecoverySettingsTelemetry();
    const [loading, withLoading] = useLoading();

    return (
        <>
            <SafetyReviewCardHeader>
                <SafetyReviewCardHeader.Illustration>
                    <img src={paperplaneIllustration} alt="" width={80} height={64} />
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
                    sendRecoverySettingEnabled({ setting: 'recovery_by_email' });
                    props.safetyReview.actions.next('completed', props.recoveryItem);
                }}
                onError={(error) => {
                    // eslint-disable-next-line no-console
                    console.error(error);
                }}
                value={props.recoveryItem.recoveryItem.data.value}
                method="email"
            />
            <SafetyReviewCta {...props} loading={loading} cta={c('safety_review').t`Verify`} />
        </>
    );
};
