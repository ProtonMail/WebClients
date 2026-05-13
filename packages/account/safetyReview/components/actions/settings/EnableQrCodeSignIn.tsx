import { c } from 'ttag';

import { toggleQrCodeSignIn } from '@proton/account/recovery/userSettingsActions';
import { SafetyReviewCta } from '@proton/account/safetyReview/components/SafetyReviewCta';
import type { SafetyReviewAllProps } from '@proton/account/safetyReview/components/interface';
import type { ExtractRecoveryActionItem } from '@proton/account/safetyReview/recoveryState/recoveryState';
import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import darkIllustration from '../../assets/recovery-qr-code-dark.svg';
import illustration from '../../assets/recovery-qr-code.svg';
import { SafetyReviewCardHeader } from '../../cards/SafetyReviewCardHeader';

type Props = SafetyReviewAllProps & {
    recoveryItem: ExtractRecoveryActionItem<'qrCodeSignIn'>;
};
export const EnableQrCodeSignIn = (props: Props) => {
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
                        await dispatch(toggleQrCodeSignIn({ value: true }));
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
                    {c('safety_review').t`Allow scanning a QR code to sign in`}
                </SafetyReviewCardHeader.Title>
                <SafetyReviewCardHeader.Description>
                    {c('safety_review')
                        .t`If you forget your password, you can sign in using a QR code. All you need is to be signed in to a ${BRAND_NAME} service on another device.`}
                </SafetyReviewCardHeader.Description>
                <SafetyReviewCardHeader.Description>
                    {c('safety_review')
                        .t`This will let you quickly access your ${BRAND_NAME} Account so you can change your password.`}
                </SafetyReviewCardHeader.Description>
            </SafetyReviewCardHeader>

            <SafetyReviewCta {...props} loading={loading} cta={c('safety_review').t`Allow`} />
        </form>
    );
};
