import { useLocation } from 'react-router';

import { c } from 'ttag';

import { Kbd } from '@proton/atoms';
import { Icon, ToolbarButton } from '@proton/components';

import useMailModel from 'proton-mail/hooks/useMailModel';

import { isConversationMode } from '../../helpers/mailSettings';

interface Props {
    loading: boolean;
    conversationMode: boolean;
    elementID?: string;
    messageID?: string;
    elementIDs: string[];
    onElement: (elementID?: string, preventComposer?: boolean) => void;
    labelID: string;
}

const NavigationControls = ({
    loading,
    conversationMode,
    elementID,
    messageID,
    elementIDs,
    onElement,
    labelID,
}: Props) => {
    const location = useLocation();
    const mailSettings = useMailModel('MailSettings');
    const { Shortcuts } = mailSettings;

    const ID = !isConversationMode(labelID, mailSettings, location) && messageID ? messageID : elementID;
    const index = elementIDs.findIndex((id) => id === ID);

    const handleNext = () => onElement(elementIDs[index + 1], true);
    const handlePrevious = () => onElement(elementIDs[index - 1], true);

    const titlePreviousConversation = Shortcuts ? (
        <>
            {c('Title').t`Previous conversation`}
            <br />
            <Kbd shortcut="K" />
        </>
    ) : (
        c('Title').t`Previous conversation`
    );

    const titlePreviousMessage = Shortcuts ? (
        <>
            {c('Title').t`Previous message`}
            <br />
            <Kbd shortcut="K" />
        </>
    ) : (
        c('Title').t`Previous message`
    );

    const titleNextConversation = Shortcuts ? (
        <>
            {c('Title').t`Next conversation`}
            <br />
            <Kbd shortcut="J" />
        </>
    ) : (
        c('Title').t`Next conversation`
    );

    const titleNextMessage = Shortcuts ? (
        <>
            {c('Title').t`Next message`}
            <br />
            <Kbd shortcut="J" />
        </>
    ) : (
        c('Title').t`Next message`
    );

    return (
        <>
            <ToolbarButton
                disabled={loading || index <= 0}
                title={conversationMode ? titlePreviousConversation : titlePreviousMessage}
                onClick={handlePrevious}
                className="hidden lg:flex"
                data-testid="toolbar:previous-element"
                icon={
                    <Icon
                        name="arrow-up"
                        alt={conversationMode ? c('Action').t`Previous conversation` : c('Action').t`Previous message`}
                    />
                }
            />
            <ToolbarButton
                disabled={loading || index >= elementIDs.length - 1}
                title={conversationMode ? titleNextConversation : titleNextMessage}
                onClick={handleNext}
                className="hidden lg:flex"
                data-testid="toolbar:next-element"
                icon={
                    <Icon
                        name="arrow-down"
                        alt={conversationMode ? c('Action').t`Next conversation` : c('Action').t`Next message`}
                    />
                }
            />
        </>
    );
};

export default NavigationControls;
