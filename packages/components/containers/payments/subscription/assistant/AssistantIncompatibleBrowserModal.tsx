import { c } from 'ttag';

import { userSettingsActions } from '@proton/account/userSettings';
import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Prompt from '@proton/components/components/prompt/Prompt';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store';
import { updateAIAssistant } from '@proton/shared/lib/api/settings';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { AI_ASSISTANT_ACCESS, type UserSettings } from '@proton/shared/lib/interfaces';

interface Props {
    modalProps: ModalProps;
    onResolve?: () => void;
    onReject?: () => void;
}

/**
 * TODO: Revert this later
 * We currently have an issue on the desktop app where it's not possible to run the assistant locally,
 * because "shader-f16" is missing.
 * We need to remove desktop app mentions from this modal for the release, and put them back once we have a fix
 */
const AssistantIncompatibleBrowserModal = ({ modalProps, onReject, onResolve }: Props) => {
    const { createNotification } = useNotifications();
    const { onClose } = modalProps;
    // const goToSettings = useSettingsLink();
    const [loading, withLoading] = useLoading();
    const dispatch = useDispatch();
    const api = useApi();

    const handleRejectThenClose = () => {
        onReject?.();
        onClose?.();
    };

    const handleUpdateSetting = async () => {
        const { UserSettings } = await api<{ UserSettings: UserSettings }>(
            updateAIAssistant(AI_ASSISTANT_ACCESS.SERVER_ONLY)
        );
        dispatch(userSettingsActions.set({ UserSettings }));
        createNotification({ text: c('Success').t`Writing assistant setting updated` });
        onResolve?.();
        onClose?.();
    };

    /* translator:
     * Full string for reference: Your browser doesn’t support the writing assistant. Try running it on Proton servers.
     */
    const modalText = c('Info').t`Your browser doesn't support the writing assistant. Try running it on servers.`;

    const buttons: [JSX.Element, JSX.Element] | [JSX.Element, JSX.Element, JSX.Element] = (() => {
        return [
            <Button color="norm" onClick={() => withLoading(handleUpdateSetting())} loading={loading}>{c('Action')
                .t`Run on ${BRAND_NAME} servers`}</Button>,
            <Button onClick={handleRejectThenClose}>{c('Action').t`Cancel`}</Button>,
        ];
    })();

    return (
        <Prompt
            title={c('Info').t`Browser not supported`}
            buttons={buttons}
            {...modalProps}
            onClose={handleRejectThenClose}
        >
            <span className="mr-1">{modalText}</span>
            <Href
                className="inline-block"
                href={getKnowledgeBaseUrl('/proton-scribe-writing-assistant#local-or-server')}
            >
                {c('Info').t`Learn more`}
            </Href>
        </Prompt>
    );
};

export default AssistantIncompatibleBrowserModal;
