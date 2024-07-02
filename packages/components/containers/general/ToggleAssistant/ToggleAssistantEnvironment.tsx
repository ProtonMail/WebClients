import { c } from 'ttag';

import { Info, RadioGroup } from '@proton/components';
import { useApi, useEventManager, useNotifications } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import { updateAIAssistant } from '@proton/shared/lib/api/settings';
import { AI_ASSISTANT_ACCESS } from '@proton/shared/lib/interfaces';

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
    const { createNotification } = useNotifications();

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
                            label: <EnvironmentOption runtime={CLIENT_ONLY} />,
                            value: CLIENT_ONLY,
                            disabled: loading,
                        },
                        {
                            label: <EnvironmentOption runtime={SERVER_ONLY} />,
                            value: SERVER_ONLY,
                            disabled: loading,
                        },
                    ]}
                />
            </div>
        </>
    );
};

export default ToggleAssistantEnvironment;
