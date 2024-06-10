import { c } from 'ttag';

import { Button, Href } from '@proton/atoms/index';
import { ModalProps, Prompt, useApi, useEventManager, useSettingsLink } from '@proton/components/index';
import useLoading from '@proton/hooks/useLoading';
import { updateAIAssistant } from '@proton/shared/lib/api/settings';
import { APPS, BRAND_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { isDesktop } from '@proton/shared/lib/helpers/browser';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { AI_ASSISTANT_ACCESS } from '@proton/shared/lib/interfaces';

interface Props {
    modalProps: ModalProps;
}

const AssistantIncompatibleBrowserModal = ({ modalProps }: Props) => {
    const isDesktopApp = isDesktop();
    const { onClose } = modalProps;
    const goToSettings = useSettingsLink();
    const [loading, withLoading] = useLoading();
    const { call } = useEventManager();
    const api = useApi();

    const handleDownloadDesktopApp = () => {
        goToSettings('/get-the-apps#proton-mail-desktop-apps', APPS.PROTONMAIL, true);

        onClose?.();
    };

    const handleUpdateSetting = async () => {
        await withLoading(api(updateAIAssistant(AI_ASSISTANT_ACCESS.SERVER_ONLY)));
        await call();
        onClose?.();
    };

    const modalText = isDesktopApp
        ? /* translator:
           * Full string for reference: Your browser doesn’t support the writing assistant. Try running it on Proton servers.
           */
          c('Info').t`Your browser doesn't support the writing assistant. Try running it on ${BRAND_NAME} servers.`
        : /* translator:
           * Full string for reference: Your browser doesn’t support the writing assistant. Download the Proton Mail desktop app or try running it on Proton servers.
           */
          c('Info')
              .t`Your browser doesn't support the writing assistant. Download the ${MAIL_APP_NAME} desktop app or try running it on ${BRAND_NAME} servers.`;

    const buttons: [JSX.Element, JSX.Element] | [JSX.Element, JSX.Element, JSX.Element] = (() => {
        if (isDesktopApp) {
            return [
                <Button color="norm" onClick={handleUpdateSetting} loading={loading}>{c('Action')
                    .t`Run on ${BRAND_NAME} servers`}</Button>,
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ];
        }

        return [
            <Button color="norm" onClick={handleDownloadDesktopApp}>{c('Action').t`Download Desktop App`}</Button>,
            <Button onClick={handleUpdateSetting} loading={loading}>{c('Action')
                .t`Run on ${BRAND_NAME} servers`}</Button>,
            <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
        ];
    })();

    return (
        <Prompt title={c('Info').t`Browser not supported`} buttons={buttons} {...modalProps}>
            <span>{modalText}</span>
            <Href className="ml-2" href={getKnowledgeBaseUrl('/proton-scribe-writing-assistant#local-or-server')}>
                {c('Info').t`Learn more`}
            </Href>
        </Prompt>
    );
};

export default AssistantIncompatibleBrowserModal;
