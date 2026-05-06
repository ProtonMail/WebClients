import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { RecoveryKitAction } from '@proton/account/recovery/recoveryKit/RecoveryKitAction';
import type { RecoveryKitContentProps } from '@proton/account/recovery/recoveryKit/RecoveryKitContent';
import type { DeferredMnemonicData } from '@proton/account/recovery/recoveryKit/generateDeferredMnemonicData';
import { generateRecoveryKitData, setRecoveryPhrase } from '@proton/account/recovery/recoveryKit/recoveryPhraseActions';
import { SafetyReviewCta } from '@proton/account/safetyReview/components/SafetyReviewCta';
import type { SafetyReviewAllProps } from '@proton/account/safetyReview/components/interface';
import type { ExtractRecoveryActionItem } from '@proton/account/safetyReview/recoveryState/recoveryState';
import Loader from '@proton/components/components/loader/Loader';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import illustration from '../../assets/recovery-phrase.svg';
import { SafetyReviewCardHeader } from '../../cards/SafetyReviewCardHeader';

type Props = SafetyReviewAllProps & {
    recoveryItem: ExtractRecoveryActionItem<'recoveryPhrase'>;
};
export const DownloadRecoveryPhrase = (props: Props) => {
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
                    const newRecoveryKitData = await dispatch(setRecoveryPhrase(recoveryKitData));
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
                    <img src={illustration} alt="" width={64} height={64} />
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
