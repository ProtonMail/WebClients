import { useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Href } from '@proton/atoms/Href';
import { Icon } from '@proton/components/components';
import { FeatureCode } from '@proton/components/containers';
import {
    useApi,
    useAssistantSubscriptionStatus,
    useEventManager,
    useSpotlightOnFeature,
    useUserSettings,
} from '@proton/components/hooks';
import { ASSISTANT_TRIAL_TIME_DAYS } from '@proton/components/hooks/assistant/useAssistantSubscriptionStatus';
import useAssistantTelemetry from '@proton/components/hooks/assistant/useAssistantTelemetry';
import useLoading from '@proton/hooks/useLoading';
import { useAssistant } from '@proton/llm/lib';
import { updateAIAssistant } from '@proton/shared/lib/api/settings';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getStaticURL } from '@proton/shared/lib/helpers/url';
import { AI_ASSISTANT_ACCESS } from '@proton/shared/lib/interfaces';
import desktopImg from '@proton/styles/assets/img/illustrations/desktop-screen.svg';
import serverImg from '@proton/styles/assets/img/illustrations/servers.svg';
import clsx from '@proton/utils/clsx';

import { useComposerAssistantProvider } from 'proton-mail/components/assistant/provider/ComposerAssistantProvider';
import ComposerInnerModal from 'proton-mail/components/composer/modals/ComposerInnerModal';

const { SERVER_ONLY, CLIENT_ONLY, UNSET } = AI_ASSISTANT_ACCESS;

interface Props {
    composerID: string;
    onClose: () => void;
    onToggleAssistant: (aiFlag: AI_ASSISTANT_ACCESS) => void;
}

const ComposerAssistantSettingModal = ({ composerID, onClose: closeSettingModal, onToggleAssistant }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const [loading, withLoading] = useLoading();
    const [{ AIAssistantFlags }] = useUserSettings();
    const { trialStatus } = useAssistantSubscriptionStatus();
    // Feature flag that we use to open the assistant automatically the first time the user opens the composer
    const { onDisplayed: onDisplayedComposerSpotlight } = useSpotlightOnFeature(
        FeatureCode.ComposerAssistantInitialSetup
    );
    const { handleSettingChange, handleCheckHardwareCompatibility } = useAssistant();
    const { sendShowAssistantReport } = useAssistantTelemetry();
    const { displayAssistantModal } = useComposerAssistantProvider();

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
        const closeModal = async () => {
            closeSettingModal();
            sendShowAssistantReport();
        };

        await updateSetting();

        if (inputValue === SERVER_ONLY) {
            await closeModal();
            onToggleAssistant(inputValue);
            return;
        }

        if (inputValue === CLIENT_ONLY) {
            const { hasCompatibleHardware, hasCompatibleBrowser } = await handleCheckHardwareCompatibility();
            const canRunLocally = hasCompatibleHardware && hasCompatibleBrowser;
            if (canRunLocally) {
                await closeModal();
                onToggleAssistant(inputValue);
                void handleSettingChange?.();
                return;
            }

            onDisplayedComposerSpotlight();
            closeSettingModal();

            if (!canRunLocally) {
                if (!hasCompatibleBrowser) {
                    displayAssistantModal('incompatibleBrowser');
                } else {
                    displayAssistantModal('incompatibleHardware');
                }
            }
        }
    };

    const handleCancel = () => {
        closeSettingModal();
    };

    const PrivacyLink = (
        <Href key="privacy-link" href={getStaticURL('/blog/proton-scribe-writing-assistant')}>
            {c('Info').t`Learn more about the writing assistant`}
        </Href>
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
                        <div className="color-weak pt-4 text-center">
                            {
                                // translator: Full sentence: "Free to try for 14 days".
                                c('Info').ngettext(
                                    msgid`Free to try for ${ASSISTANT_TRIAL_TIME_DAYS} day`,
                                    `Free to try for ${ASSISTANT_TRIAL_TIME_DAYS} days`,
                                    ASSISTANT_TRIAL_TIME_DAYS
                                )
                            }
                        </div>
                    )}
                </>
            }
        >
            <div className="flex flex-column flex-nowrap gap-3 my-4">
                <Button
                    className={clsx(
                        'flex flex-row flex-nowrap rounded-xl',
                        inputValue === CLIENT_ONLY && 'display-focus-visible'
                    )}
                    disabled={loading}
                    aria-pressed={inputValue === CLIENT_ONLY}
                    shape="outline"
                    color={inputValue === CLIENT_ONLY ? 'norm' : 'weak'}
                    onClick={() => setInputValue(CLIENT_ONLY)}
                    id={`assistant-setting-${composerID}`}
                >
                    <span className="shrink-0 flex my-auto">
                        <img src={desktopImg} alt="" className="m-auto" />
                    </span>
                    <span className="flex-1 text-left my-1 pl-3 pr-2">
                        <span>{c('Assistant option').t`Securely run on device`}</span>
                        <span className="block m-0 mt-1 color-weak text-sm">
                            {c('Assistant option')
                                .t`Data remains on device to protect your privacy. Requires a download and compatible hardware.`}
                        </span>
                    </span>
                    <span
                        className={clsx(
                            'shrink-0 my-auto',
                            inputValue === CLIENT_ONLY ? 'color-primary' : 'visibility-hidden'
                        )}
                    >
                        <Icon name="checkmark" />
                    </span>
                </Button>
                <Button
                    className={clsx(
                        'flex flex-row flex-nowrap rounded-xl',
                        inputValue === SERVER_ONLY && 'display-focus-visible'
                    )}
                    disabled={loading}
                    aria-pressed={inputValue === SERVER_ONLY}
                    shape="outline"
                    color={inputValue === SERVER_ONLY ? 'norm' : 'weak'}
                    onClick={() => setInputValue(SERVER_ONLY)}
                    id={`assistant-setting-${composerID}`}
                >
                    <span className="shrink-0 flex my-auto">
                        <img src={serverImg} alt="" className="m-auto" />
                    </span>
                    <span className="flex-1 text-left my-1 pl-3 pr-2">
                        <span>{c('Assistant option').t`Securely run on ${BRAND_NAME} servers`}</span>
                        <span className="block m-0 mt-1 color-weak text-sm">{c('Assistant option')
                            .t`No logs are kept to protect your privacy. Faster processing.`}</span>
                    </span>
                    <span
                        className={clsx(
                            'shrink-0 my-auto',
                            inputValue === SERVER_ONLY ? 'color-primary' : 'visibility-hidden'
                        )}
                    >
                        <Icon name="checkmark" />
                    </span>
                </Button>
            </div>
            <p className="my-2 color-weak text-center">{PrivacyLink}</p>
        </ComposerInnerModal>
    );
};

export default ComposerAssistantSettingModal;
