import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import Loader from '@proton/components/components/loader/Loader';
import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { RecoveryKitAction } from '../../../../recovery/recoveryKit/RecoveryKitAction';
import type { RecoveryKitContentProps } from '../../../../recovery/recoveryKit/RecoveryKitContent';
import type { DeferredMnemonicData } from '../../../../recovery/recoveryKit/generateDeferredMnemonicData';
import { generateRecoveryKitData, setRecoveryPhrase } from '../../../../recovery/recoveryKit/recoveryPhraseActions';
import type { ExtractRecoveryActionItem } from '../../../recoveryState/recoveryState';
import { SafetyReviewCta } from '../../SafetyReviewCta';
import darkIllustration from '../../assets/recovery-phrase-dark.svg';
import illustration from '../../assets/recovery-phrase.svg';
import { SafetyReviewCardHeader } from '../../cards/SafetyReviewCardHeader';
import type { SafetyReviewAllProps } from '../../interface';

type Props = SafetyReviewAllProps & {
    recoveryItem: ExtractRecoveryActionItem<'recoveryPhrase'>;
};
export const DownloadRecoveryPhrase = (props: Props) => {
    const theme = useTheme();
    const isDarkTheme = theme.information.dark;
    const dispatch = useDispatch();
    const handleError = useErrorHandler();

    const [recoveryKitData, setRecoveryKitData] = useState<DeferredMnemonicData | null>(null);
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();

    useEffect(() => {
        void (async function initialize() {
            try {
                const data = await dispatch(generateRecoveryKitData());
                setRecoveryKitData(data);
            } catch (e) {
                handleError(e);
                // Skip as there's nothing meaningful to do at this point
                props.safetyReview.actions.next('skipped', props.recoveryItem);
            }
        })();
    }, []);

    const handleSaveRecoveryKit: RecoveryKitContentProps['onSaveRecoveryKit'] = (type, recoveryKitData) => {
        const handleSave = async () => {
            await recoveryKitData.save.handle(type);
            if (type === 'copy') {
                createNotification({ text: c('Info').t`Recovery phrase copied to clipboard` });
            }
        };

        // If we've already sent the payload for this data we'll just save the kit.
        if (recoveryKitData.hasSentPayload) {
            handleSave().catch(noop);
            return;
        }
        void withLoading(
            (async () => {
                try {
                    const newRecoveryKitData = await dispatch(setRecoveryPhrase(recoveryKitData, true));
                    setRecoveryKitData(newRecoveryKitData);
                    handleSave().catch(noop);
                } catch (e) {
                    handleError(e);
                }
            })()
        );
    };

    return (
        <form
            id={props.firstItemId}
            onSubmit={(event) => {
                event.preventDefault();
                if (!recoveryKitData || !recoveryKitData.hasSentPayload) {
                    return;
                }
                props.safetyReview.actions.next('completed', props.recoveryItem);
            }}
        >
            <SafetyReviewCardHeader>
                <SafetyReviewCardHeader.Illustration>
                    <img src={isDarkTheme ? darkIllustration : illustration} alt="" width={64} height={64} />
                </SafetyReviewCardHeader.Illustration>
                <SafetyReviewCardHeader.Title>
                    {c('safety_review').t`Save recovery phrase`}
                </SafetyReviewCardHeader.Title>
                <SafetyReviewCardHeader.Description>
                    {c('safety_review')
                        .t`If you get locked out of your ${BRAND_NAME} Account, it will allow you to sign in and recover your data. It’s the only way to instantly restore everything, so make sure you keep it somewhere safe.`}
                </SafetyReviewCardHeader.Description>
            </SafetyReviewCardHeader>
            {!recoveryKitData ? (
                <div className="flex justify-center py-12">
                    <Loader />
                </div>
            ) : (
                <RecoveryKitAction
                    recoveryKitData={recoveryKitData}
                    onSaveRecoveryKit={handleSaveRecoveryKit}
                    loading={loading}
                    cardClasses="rounded-lg border border-weak"
                />
            )}
            <SafetyReviewCta
                {...props}
                onSkip={() => {
                    if (recoveryKitData?.hasSentPayload) {
                        props.safetyReview.actions.next('completed', props.recoveryItem);
                    } else {
                        props.safetyReview.actions.next('skipped', props.recoveryItem);
                    }
                }}
                disabled={!recoveryKitData?.hasSentPayload}
                cta={c('safety_review').t`Done`}
            />
        </form>
    );
};
