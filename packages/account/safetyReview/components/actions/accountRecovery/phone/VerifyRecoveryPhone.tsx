import { c } from 'ttag';

import { SafetyReviewCta } from '@proton/account/safetyReview/components/SafetyReviewCta';
import { VerifyRecoveryMethod } from '@proton/account/safetyReview/components/actions/accountRecovery/verify/VerifyRecoveryMethod';
import type { SafetyReviewAllProps } from '@proton/account/safetyReview/components/interface';
import type { ExtractRecoveryActionItem } from '@proton/account/safetyReview/recoveryState/recoveryState';
import FormattedPhoneValue from '@proton/components/components/v2/phone/LazyFormattedPhoneValue';
import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import useLoading from '@proton/hooks/useLoading';

import darkPaperplaneIllustration from '../../../assets/paperplane-dark.svg';
import paperplaneIllustration from '../../../assets/paperplane.svg';
import { SafetyReviewCardHeader } from '../../../cards/SafetyReviewCardHeader';

type Props = SafetyReviewAllProps & {
    recoveryItem: ExtractRecoveryActionItem<'verifyRecoveryPhone'>;
};

export const VerifyRecoveryPhone = (props: Props) => {
    const theme = useTheme();
    const isDarkTheme = theme.information.dark;
    const formattedPhoneNumber = <FormattedPhoneValue value={props.recoveryItem.recoveryItem.data.value} />;
    const boldPhoneNumber = <b key="phone-number">{formattedPhoneNumber}</b>;
    const [loading, withLoading] = useLoading();

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
                value={props.recoveryItem.recoveryItem.data.value}
                method="phone"
            />
            <SafetyReviewCta {...props} cta={c('safety_review').t`Verify`} />
        </>
    );
};
