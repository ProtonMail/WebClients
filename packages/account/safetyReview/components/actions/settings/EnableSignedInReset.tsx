import { c } from 'ttag';

import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { toggleSignedInReset } from '../../../../recovery/userSettingsActions';
import type { ExtractRecoveryActionItem } from '../../../recoveryState/recoveryState';
import { SafetyReviewCta } from '../../SafetyReviewCta';
import darkIllustration from '../../assets/session-recovery-dark.svg';
import illustration from '../../assets/session-recovery.svg';
import { SafetyReviewCardHeader } from '../../cards/SafetyReviewCardHeader';
import type { SafetyReviewAllProps } from '../../interface';

type Props = SafetyReviewAllProps & {
    recoveryItem: ExtractRecoveryActionItem<'signedInReset'>;
};
export const EnableSignedInReset = (props: Props) => {
    const theme = useTheme();
    const isDarkTheme = theme.information.dark;
    const [loading, withLoading] = useLoading();
    const dispatch = useDispatch();

    return (
        <form
            id={props.firstItemId}
            onSubmit={(event) => {
                event.preventDefault();
                withLoading(
                    (async function () {
                        await dispatch(toggleSignedInReset({ value: true, persistPasswordScope: true }));
                        props.safetyReview.actions.next('completed', props.recoveryItem);
                    })()
                ).catch(noop);
            }}
        >
            <SafetyReviewCardHeader>
                <SafetyReviewCardHeader.Illustration>
                    <img src={isDarkTheme ? darkIllustration : illustration} alt="" width={64} height={64} />
                </SafetyReviewCardHeader.Illustration>
                <SafetyReviewCardHeader.Title>
                    {c('safety_review').t`Allow password reset from the settings`}
                </SafetyReviewCardHeader.Title>
                <SafetyReviewCardHeader.Description>
                    {c('safety_review')
                        .t`This will let you reset your account password if you’ve lost it, but are still signed in to ${BRAND_NAME}. It’s often the easiest way to recover your account if you’re signed in.`}
                </SafetyReviewCardHeader.Description>
            </SafetyReviewCardHeader>

            <SafetyReviewCta {...props} loading={loading} cta={c('safety_review').t`Allow`} />
        </form>
    );
};
