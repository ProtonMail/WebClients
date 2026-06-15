import { c } from 'ttag';

import { downloadRecoveryFileThunk } from '@proton/account/recovery/recoveryFile';
import { SafetyReviewCta } from '@proton/account/safetyReview/components/SafetyReviewCta';
import type { SafetyReviewAllProps } from '@proton/account/safetyReview/components/interface';
import type { ExtractRecoveryActionItem } from '@proton/account/safetyReview/recoveryState/recoveryState';
import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import noop from '@proton/utils/noop';

import darkIllustration from '../../assets/recovery-file-dark.svg';
import illustration from '../../assets/recovery-file.svg';
import { SafetyReviewCardHeader } from '../../cards/SafetyReviewCardHeader';

type Props = SafetyReviewAllProps & {
    recoveryItem: ExtractRecoveryActionItem<'recoveryFile'>;
};

export const DownloadRecoveryFile = (props: Props) => {
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
                        await dispatch(downloadRecoveryFileThunk(true));
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
                    {c('safety_review').t`Download recovery file`}
                </SafetyReviewCardHeader.Title>
                <SafetyReviewCardHeader.Description>
                    {c('safety_review')
                        .t`This will restore access to emails, contacts, files, passwords, and any other encrypted data on your account after a password reset.`}
                </SafetyReviewCardHeader.Description>
                <SafetyReviewCardHeader.Description>
                    {c('safety_review')
                        .t`You don’t need to open or read the file—just download it and store it somewhere safe.`}
                </SafetyReviewCardHeader.Description>
            </SafetyReviewCardHeader>

            <SafetyReviewCta {...props} loading={loading} cta={c('safety_review').t`Download`} />
        </form>
    );
};
