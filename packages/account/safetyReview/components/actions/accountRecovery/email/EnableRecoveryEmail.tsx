import { c } from 'ttag';

import { toggleRecoveryEmailReset } from '@proton/account/recovery/accountRecoveryActions';
import { SafetyReviewCta } from '@proton/account/safetyReview/components/SafetyReviewCta';
import type { SafetyReviewAllProps } from '@proton/account/safetyReview/components/interface';
import type { ExtractRecoveryActionItem } from '@proton/account/safetyReview/recoveryState/recoveryState';
import { useRecoverySettingsTelemetry } from '@proton/components/containers/recovery/recoverySettingsTelemetry';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import noop from '@proton/utils/noop';

import recoveryEmailIllustration from '../../../assets/recovery-email.svg';
import { SafetyReviewCardHeader } from '../../../cards/SafetyReviewCardHeader';

type Props = SafetyReviewAllProps & {
    recoveryItem: ExtractRecoveryActionItem<'enableRecoveryEmail'>;
};
export const EnableRecoveryEmail = (props: Props) => {
    const dispatch = useDispatch();
    const { sendRecoverySettingEnabled } = useRecoverySettingsTelemetry();
    const [loading, withLoading] = useLoading();

    return (
        <form
            id={props.firstItemId}
            onSubmit={(event) => {
                event.preventDefault();
                withLoading(
                    (async function () {
                        await dispatch(
                            toggleRecoveryEmailReset({
                                value: true,
                                persistPasswordScope: true,
                            })
                        );
                        sendRecoverySettingEnabled({ setting: 'recovery_by_email' });
                        props.safetyReview.actions.next('completed', props.recoveryItem);
                    })()
                ).catch(noop);
            }}
        >
            <SafetyReviewCardHeader>
                <SafetyReviewCardHeader.Illustration>
                    <img src={recoveryEmailIllustration} alt="" width={64} height={64} />
                </SafetyReviewCardHeader.Illustration>
                <SafetyReviewCardHeader.Title>{c('safety_review')
                    .t`Allow recovery by email`}</SafetyReviewCardHeader.Title>
                <SafetyReviewCardHeader.Description>
                    {c('safety_review')
                        .t`You can use email verification to regain access to your account if you forget your password.`}
                </SafetyReviewCardHeader.Description>
            </SafetyReviewCardHeader>
            <div className="mb-12 p-6 rounded-lg bg-weak border text-semibold text-center text-lg">
                {props.recoveryItem.recoveryItem.data.value}
            </div>

            <SafetyReviewCta {...props} loading={loading} cta={c('safety_review').t`Allow`} />
        </form>
    );
};
