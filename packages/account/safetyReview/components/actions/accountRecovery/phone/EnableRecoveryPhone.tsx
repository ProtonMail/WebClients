import { c } from 'ttag';

import { toggleRecoveryPhoneReset } from '@proton/account/recovery/accountRecoveryActions';
import { SafetyReviewCta } from '@proton/account/safetyReview/components/SafetyReviewCta';
import type { SafetyReviewAllProps } from '@proton/account/safetyReview/components/interface';
import type { ExtractRecoveryActionItem } from '@proton/account/safetyReview/recoveryState/recoveryState';
import FormattedPhoneValue from '@proton/components/components/v2/phone/LazyFormattedPhoneValue';
import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import noop from '@proton/utils/noop';

import darkRecoveryPhoneIllustration from '../../../assets/recovery-phone-dark.svg';
import recoveryPhoneIllustration from '../../../assets/recovery-phone.svg';
import { SafetyReviewCardHeader } from '../../../cards/SafetyReviewCardHeader';

type Props = SafetyReviewAllProps & {
    recoveryItem: ExtractRecoveryActionItem<'enableRecoveryPhone'>;
};
export const EnableRecoveryPhone = (props: Props) => {
    const theme = useTheme();
    const isDarkTheme = theme.information.dark;
    const dispatch = useDispatch();
    const formattedPhoneNumber = <FormattedPhoneValue value={props.recoveryItem.recoveryItem.data.value} />;
    const [loading, withLoading] = useLoading();

    return (
        <form
            id={props.firstItemId}
            onSubmit={(event) => {
                event.preventDefault();
                withLoading(
                    (async function () {
                        await dispatch(
                            toggleRecoveryPhoneReset({
                                value: true,
                                persistPasswordScope: true,
                            })
                        );
                        props.safetyReview.actions.next('completed', props.recoveryItem);
                    })()
                ).catch(noop);
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
                    .t`Allow recovery by phone`}</SafetyReviewCardHeader.Title>
                <SafetyReviewCardHeader.Description>
                    {c('safety_review')
                        .t`You can use SMS verification to regain access to your account if you forget your password.`}
                </SafetyReviewCardHeader.Description>
            </SafetyReviewCardHeader>
            <div className="mb-12 p-6 rounded-lg bg-weak border text-semibold text-center text-lg">
                {formattedPhoneNumber}
            </div>
            <SafetyReviewCta {...props} loading={loading} cta={c('safety_review').t`Allow`} />
        </form>
    );
};
