import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Href } from '@proton/atoms/Href';
import { RadioGroup } from '@proton/components/components';
import { FeatureCode } from '@proton/components/containers';
import {
    useApi,
    useAssistantSubscriptionStatus,
    useEventManager,
    useSpotlightOnFeature,
    useUserSettings,
} from '@proton/components/hooks';
import { ASSISTANT_TRIAL_TIME_DAYS } from '@proton/components/hooks/assistant/useAssistantSubscriptionStatus';
import useLoading from '@proton/hooks/useLoading';
import { useAssistant } from '@proton/llm/lib';
import useAssistantTelemetry from '@proton/llm/lib/useAssistantTelemetry';
import { updateAIAssistant } from '@proton/shared/lib/api/settings';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import { getStaticURL } from '@proton/shared/lib/helpers/url';
import { AI_ASSISTANT_ACCESS } from '@proton/shared/lib/interfaces';

import { useComposerAssistantProvider } from 'proton-mail/components/assistant/provider/ComposerAssistantProvider';
import ComposerInnerModal from 'proton-mail/components/composer/modals/ComposerInnerModal';

const { SERVER_ONLY, CLIENT_ONLY, UNSET } = AI_ASSISTANT_ACCESS;

interface Props {
    composerID: string;
    onClose: () => void;
}

const ComposerAssistantSettingModal = ({ composerID, onClose: closeSettingModal }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const [loading, withLoading] = useLoading();
    const [{ AIAssistantFlags }] = useUserSettings();
    const { trialStatus } = useAssistantSubscriptionStatus();
    // Feature flag that we use to open the assistant automatically the first time the user opens the composer
    const { onDisplayed: onDisplayedComposerSpotlight } = useSpotlightOnFeature(
        FeatureCode.ComposerAssistantInitialSetup
    );
    const { hasCompatibleBrowser, hasCompatibleHardware, closeAssistant } = useAssistant();
    const { displayAssistantModalPromise, assistantRefManager: assistantInputRefManager } =
        useComposerAssistantProvider();
    const { sendShowAssistantReport } = useAssistantTelemetry();

    // Default to server only if unset
    const [inputValue, setInputValue] = useState<AI_ASSISTANT_ACCESS>(
        UNSET === AIAssistantFlags ? SERVER_ONLY : AIAssistantFlags
    );

    const handleSubmit = async () => {
        const updateSetting = async () => {
            if (AIAssistantFlags !== inputValue) {
                await api(updateAIAssistant(inputValue));
                await call();
            }
        };
        const waitAndClickInput = async () => {
            // TODO: This is a workaround to avoid failure with sending the assistant input click event
            // Wait for proper state update before closing the modal
            await wait(100);
            closeSettingModal();
            // trigger click on input to continue the assistant flow
            assistantInputRefManager.input.get(composerID)?.current?.click();
            sendShowAssistantReport();
        };

        await updateSetting();

        if (inputValue === SERVER_ONLY) {
            await waitAndClickInput();
            return;
        }

        if (inputValue === CLIENT_ONLY) {
            const canRunLocally = hasCompatibleHardware && hasCompatibleBrowser;
            if (canRunLocally) {
                await waitAndClickInput();
                return;
            }

            onDisplayedComposerSpotlight();
            closeSettingModal();

            try {
                const modalType = (() => {
                    if (!hasCompatibleBrowser) {
                        return 'incompatibleBrowser';
                    }
                    if (!hasCompatibleHardware) {
                        return 'incompatibleHardware';
                    }
                    throw new Error('No modal type found');
                })();
                await displayAssistantModalPromise(modalType);
            } catch (e) {
                // No setting update needed, let's close the assistant
                closeAssistant(composerID);
            }
        }
    };

    const handleCancel = () => {
        closeAssistant(composerID);
        closeSettingModal();
    };

    const PrivacyLink = (
        <Href key="privacy-link" href={getStaticURL('/blog/building-private-ai-email-assistant')}>{
            // translator: full sentence => <Learn more> about Proton's writing assistant`
            c('Link').t`Learn more`
        }</Href>
    );

    return (
        <ComposerInnerModal
            title={c('Header').t`Set up the writing assistant`}
            onCancel={handleCancel}
            displayCloseButton
            displayCancel={false}
            submitActions={
                <>
                    <Button fullWidth color="norm" onClick={() => withLoading(handleSubmit)} loading={loading}>
                        {c('Action').t`Get started`}
                    </Button>
                    {trialStatus === 'trial-not-started' && (
                        <div className="color-weak pt-4 text-center">{
                            // translator: ASSISTANT_TRIAL_TIME_DAYS will always be more than one. Full sentence: "Free for 30 days".
                            c('Info').t`Free for ${ASSISTANT_TRIAL_TIME_DAYS} days`
                        }</div>
                    )}
                </>
            }
        >
            <div className="flex flex-column flex-nowrap gap-2 mt-4">
                <RadioGroup<AI_ASSISTANT_ACCESS>
                    name="assistant-runtime"
                    value={inputValue}
                    className="flex-nowrap border-bottom border-weak pb-2 radio--ontop"
                    disableChange={loading}
                    onChange={(value) => {
                        setInputValue(value);
                    }}
                    options={[
                        {
                            value: CLIENT_ONLY,
                            label: (
                                <div>
                                    <h2 className="text-rg">{c('Assistant option').t`Run locally`}</h2>
                                    <p className="m-0 mt-1 color-weak">{c('Assistant option')
                                        .t`Requires a one-time download and compatible hardware.`}</p>
                                </div>
                            ),
                        },
                        {
                            value: SERVER_ONLY,
                            label: (
                                <div>
                                    <h2 className="text-rg">{c('Assistant option').t`Run on servers`}</h2>
                                    <p className="m-0 mt-1 color-weak">{c('Assistant option')
                                        .t`Fast and secure. No logs are kept.`}</p>
                                </div>
                            ),
                        },
                    ]}
                />
            </div>
            <p className="m-0 color-weak">
                {
                    // translator: full sentence => <Learn more> about Proton's writing assistant`
                    c('Info').jt`${PrivacyLink} about ${BRAND_NAME}'s writing assistant`
                }{' '}
            </p>
        </ComposerInnerModal>
    );
};

export default ComposerAssistantSettingModal;
