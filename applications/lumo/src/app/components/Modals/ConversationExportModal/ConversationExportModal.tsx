import { useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import type { ModalProps } from '@proton/components';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader, RadioGroup } from '@proton/components';

import { useLumoStore } from '../../../redux/hooks';
import type { Conversation } from '../../../types';
import type { Format } from './exportConversation';
import { exportConversation } from './exportConversation';

interface Props extends ModalProps {
    conversation: Conversation;
}

export const ConversationExportModal = ({ conversation, onClose, ...rest }: Props) => {
    const [selectedFormat, setSelectedFormat] = useState<Format>('json');
    const store = useLumoStore();
    const { createNotification } = useNotifications();

    const onExportClick = () => {
        exportConversation(store.getState(), conversation, selectedFormat);
        createNotification({
            // translator: Success notification shown after the conversation file has been exported/downloaded.
            text: c('collider_2025:Success').t`Conversation exported`,
            type: 'success',
        });
        onClose?.();
    };

    // translator: Name of the JSON export format option, shown as a label above its description.
    const jsonLabel = c('collider_2025:Label').t`JSON`;
    // translator: Describes the JSON export format option for a conversation.
    const jsonDescription = c('collider_2025:Info')
        .t`Structured data, aiming for compatibility with the ChatGPT export format`;
    // translator: Name of the Markdown export format option, shown as a label above its description.
    const markdownLabel = c('collider_2025:Label').t`Markdown`;
    // translator: Describes the Markdown export format option for a conversation.
    const markdownDescription = c('collider_2025:Info').t`Text formatted with markdown, easy to read or share`;

    return (
        <ModalTwo enableCloseWhenClickOutside onClose={onClose} size="large" {...rest}>
            <ModalTwoHeader
                title={
                    // translator: Title for a modal that lets the user export a conversation in different formats.
                    c('collider_2025:Title').t`Export conversation`
                }
            />
            <ModalTwoContent>
                <div className="mb-4">
                    {
                        // translator: Prompt asking the user to pick an export format for the named conversation.
                        c('collider_2025:Info').jt`Choose a format to export "${conversation.title}":`
                    }
                </div>
                <div className="flex flex-column gap-2 mb-4">
                    <RadioGroup
                        name="conversation-export-format"
                        onChange={setSelectedFormat}
                        options={[
                            {
                                label: (
                                    <div className="flex-1">
                                        <div>{jsonLabel}</div>
                                        <div className="color-weak text-sm">{jsonDescription}</div>
                                    </div>
                                ),
                                value: 'json',
                            },
                            {
                                label: (
                                    <div className="flex-1">
                                        <div>{markdownLabel}</div>
                                        <div className="color-weak text-sm">{markdownDescription}</div>
                                    </div>
                                ),
                                value: 'md',
                            },
                        ]}
                        value={selectedFormat}
                    />
                </div>
                <div className="color-weak text-sm">
                    {
                        // translator: Disclaimer noting that some message content may be missing from the exported file.
                        c('collider_2025:Info')
                            .t`Some content, such as images and attachments, may not be included in the exported file.`
                    }
                </div>
            </ModalTwoContent>
            <ModalTwoFooter className="justify-end">
                <Button color="norm" onClick={onExportClick}>
                    {
                        // translator: Button label that confirms and triggers the conversation export.
                        c('collider_2025:Action').t`Export`
                    }
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
