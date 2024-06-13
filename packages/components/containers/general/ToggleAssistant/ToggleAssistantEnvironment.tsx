import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import {
    AssistantIncompatibleBrowserModal,
    AssistantIncompatibleHardwareModal,
    Info,
    RadioGroup,
    useModalStateObject,
} from '@proton/components';
import { useApi, useEventManager, useNotifications, useUserSettings } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import { updateAIAssistant } from '@proton/shared/lib/api/settings';
import { AI_ASSISTANT_ACCESS } from '@proton/shared/lib/interfaces';

import useAssistantToggle from '../../payments/subscription/assistant/useAssistantToggle';

const { SERVER_ONLY, CLIENT_ONLY, UNSET, OFF } = AI_ASSISTANT_ACCESS;

const EnvironmentOption = ({ runtime }: { runtime: AI_ASSISTANT_ACCESS }) => {
    if (runtime === SERVER_ONLY) {
        return (
            <>
                <h3 className="text-rg mr-2">{c('Assistant option').t`Run on servers`}</h3>
                <Info title={c('Assistant option').t`Faster, broader device compatibility`} />
            </>
        );
    }

    return (
        <>
            <h3 className="text-rg mr-2">{c('Assistant option').t`Run locally`}</h3>
            <Info title={c('Assistant option').t`No data transmitted while using, requires one-time download`} />
        </>
    );
};

const ToggleAssistantEnvironment = () => {
    const api = useApi();
    const { call } = useEventManager();
    const [loading, withLoading] = useLoading();
    const [{ AIAssistantFlags }] = useUserSettings();
    const { hasHardwareForModel } = useAssistantToggle();
    const { createNotification } = useNotifications();

    const hardwareModal = useModalStateObject();
    const browserModal = useModalStateObject();

    const handleIncompatibleClick = () => {
        const badBrowser = hasHardwareForModel === 'noWebGpu' || hasHardwareForModel === 'noWebGpuFirefox';

        if (badBrowser) {
            browserModal.openModal(true);
        } else if (hasHardwareForModel !== 'ok') {
            hardwareModal.openModal(true);
        }
    };

    const handleChange = async (value: AI_ASSISTANT_ACCESS) => {
        await api(updateAIAssistant(value));
        void call();

        createNotification({ text: c('Success').t`Writing assistant setting updated` });
    };

    if (AIAssistantFlags === OFF) {
        return null;
    }

    return (
        <>
            <div className="flex flex-column gap-2">
                <RadioGroup<AI_ASSISTANT_ACCESS>
                    name="assistant-runtime"
                    value={AIAssistantFlags === UNSET ? SERVER_ONLY : AIAssistantFlags}
                    disableChange={loading}
                    onChange={(value) => {
                        void withLoading(handleChange(value));
                    }}
                    options={[
                        {
                            label: <EnvironmentOption runtime={SERVER_ONLY} />,
                            value: SERVER_ONLY,
                            disabled: loading,
                        },
                        {
                            label: <EnvironmentOption runtime={CLIENT_ONLY} />,
                            value: CLIENT_ONLY,
                            disabled: hasHardwareForModel !== 'ok' || loading,
                        },
                    ]}
                />
            </div>
            {hasHardwareForModel !== 'ok' && (
                <Button color="norm" shape="underline" onClick={handleIncompatibleClick}>{c('Action')
                    .t`Why can't the model run locally?`}</Button>
            )}
            {browserModal.render && <AssistantIncompatibleBrowserModal modalProps={browserModal.modalProps} />}
            {hardwareModal.render && <AssistantIncompatibleHardwareModal modalProps={hardwareModal.modalProps} />}
        </>
    );
};

export default ToggleAssistantEnvironment;
