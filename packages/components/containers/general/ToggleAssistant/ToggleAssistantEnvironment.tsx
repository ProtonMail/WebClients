import { c } from 'ttag';

import { userSettingsActions } from '@proton/account';
import RadioGroup from '@proton/components/components/input/RadioGroup';
import Info from '@proton/components/components/link/Info';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store';
import { updateAIAssistant } from '@proton/shared/lib/api/settings';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { AI_ASSISTANT_ACCESS } from '@proton/shared/lib/interfaces';

interface Props {
    aiFlag: AI_ASSISTANT_ACCESS;
    onEnableLocal?: () => void;
    onEnableServer?: () => void;
}

const { SERVER_ONLY, CLIENT_ONLY } = AI_ASSISTANT_ACCESS;

const EnvironmentOption = ({ runtime }: { runtime: AI_ASSISTANT_ACCESS }) => {
    if (runtime === SERVER_ONLY) {
        return (
            <>
                <div className="text-rg mr-2 inline-flex">{c('Assistant option').t`Run on ${BRAND_NAME} servers`}</div>
                <span className="shrink-0">
                    <Info title={c('Assistant option').t`Fast and secure. No logs are kept.`} />
                </span>
            </>
        );
    }

    return (
        <>
            <div className="text-rg mr-2 inline-flex">{c('Assistant option').t`Run on device`}</div>
            <span className="shrink-0">
                <Info
                    title={c('Assistant option')
                        .t`Data stay on your device but requires a one-time download and compatible hardware`}
                />
            </span>
        </>
    );
};

const ToggleAssistantEnvironment = ({ aiFlag, onEnableLocal, onEnableServer }: Props) => {
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const dispatch = useDispatch();

    const handleChange = async (value: AI_ASSISTANT_ACCESS) => {
        dispatch(userSettingsActions.update({ UserSettings: { AIAssistantFlags: value } }));
        await api(updateAIAssistant(value));

        if (value === AI_ASSISTANT_ACCESS.CLIENT_ONLY) {
            onEnableLocal?.();
        } else if (value === AI_ASSISTANT_ACCESS.SERVER_ONLY) {
            onEnableServer?.();
        }

        createNotification({ text: c('Success').t`Writing assistant setting updated` });
    };

    return (
        <>
            <div className="flex flex-column gap-2">
                <RadioGroup<AI_ASSISTANT_ACCESS>
                    name="assistant-runtime"
                    className="md:mr-0 w-full flex-nowrap"
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
