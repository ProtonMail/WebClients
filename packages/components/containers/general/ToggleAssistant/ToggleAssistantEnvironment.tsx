import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import {
    AssistantIncompatibleBrowserModal,
    AssistantIncompatibleHardwareModal,
    Info,
    RadioGroup,
    useModalStateObject,
} from '@proton/components';
import { useApi, useEventManager, useNotifications } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import { updateAIAssistant } from '@proton/shared/lib/api/settings';
import { AI_ASSISTANT_ACCESS } from '@proton/shared/lib/interfaces';

import useAssistantToggle from '../../payments/subscription/assistant/useAssistantToggle';

interface Props {
    aiFlag: AI_ASSISTANT_ACCESS;
}

const { SERVER_ONLY, CLIENT_ONLY } = AI_ASSISTANT_ACCESS;

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

const ToggleAssistantEnvironment = ({ aiFlag }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const [loading, withLoading] = useLoading();
    const { hasHardwareForModel } = useAssistantToggle();
    const { createNotification } = useNotifications();

    const hardwareModal = useModalStateObject();
    const browserModal = useModalStateObject();

    const handleIncompatibleClick = () => {
        const badBrowser =
            hasHardwareForModel === 'noWebGpu' ||
            hasHardwareForModel === 'noWebGpuFirefox' ||
            hasHardwareForModel === 'noWebGpuSafari';

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

    return (
        <>
            <div className="flex flex-column gap-2">
                <RadioGroup<AI_ASSISTANT_ACCESS>
                    name="assistant-runtime"
                    value={aiFlag}
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
                <Button color="norm" shape="underline" className="py-0" onClick={handleIncompatibleClick}>{c('Action')
                    .t`Learn why this option is unavailable`}</Button>
            )}
            {browserModal.render && <AssistantIncompatibleBrowserModal modalProps={browserModal.modalProps} />}
            {hardwareModal.render && <AssistantIncompatibleHardwareModal modalProps={hardwareModal.modalProps} />}
        </>
    );
};

export default ToggleAssistantEnvironment;
