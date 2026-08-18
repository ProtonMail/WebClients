import { c } from 'ttag';

import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { exportRecoveryFile } from '@proton/shared/lib/recoveryFile/recoveryFile';
import noop from '@proton/utils/noop';

import { downloadRecoveryFileThunk } from '../../../../recovery/recoveryFile';
import type { ExtractRecoveryActionItem } from '../../../recoveryState/recoveryState';
import { SafetyReviewCta } from '../../SafetyReviewCta';
import darkIllustration from '../../assets/recovery-file-dark.svg';
import illustration from '../../assets/recovery-file.svg';
import { SafetyReviewCardHeader } from '../../cards/SafetyReviewCardHeader';
import type { SafetyReviewAllProps } from '../../interface';

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
                        const recoveryFileContents = await dispatch(downloadRecoveryFileThunk(true));
                        if (recoveryFileContents) {
                            await exportRecoveryFile(recoveryFileContents);
                        }
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
