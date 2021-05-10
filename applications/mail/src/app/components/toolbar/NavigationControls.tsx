import React from 'react';
import { Icon, ToolbarButton, useMailSettings } from 'react-components';
import { c } from 'ttag';
import { Location } from 'history';
import { MailSettings } from 'proton-shared/lib/interfaces';

import { isConversationMode } from '../../helpers/mailSettings';

interface Props {
    loading: boolean;
    conversationMode: boolean;
    elementID?: string;
    messageID?: string;
    elementIDs: string[];
    onElement: (elementID?: string, preventComposer?: boolean) => void;
    labelID: string;
    mailSettings: MailSettings;
    location: Location;
}

const NavigationControls = ({
    loading,
    conversationMode,
    elementID,
    messageID,
    elementIDs,
    onElement,
    labelID,
    mailSettings,
    location,
}: Props) => {
    const ID = !isConversationMode(labelID, mailSettings, location) && messageID ? messageID : elementID;
    const index = elementIDs.findIndex((id) => id === ID);

    const handleNext = () => onElement(elementIDs[index + 1], true);
    const handlePrevious = () => onElement(elementIDs[index - 1], true);

    const [{ Shortcuts = 1 } = {}] = useMailSettings();

    const titlePreviousConversation = Shortcuts ? (
        <>
            {c('Title').t`Previous conversation`}
            <br />
            <kbd className="no-border">K</kbd>
        </>
    ) : (
        c('Title').t`Previous conversation`
    );

    const titlePreviousMessage = Shortcuts ? (
        <>
            {c('Title').t`Previous message`}
            <br />
            <kbd className="no-border">K</kbd>
        </>
    ) : (
        c('Title').t`Previous message`
    );

    const titleNextConversation = Shortcuts ? (
        <>
            {c('Title').t`Next conversation`}
            <br />
            <kbd className="no-border">J</kbd>
        </>
    ) : (
        c('Title').t`Next conversation`
    );

    const titleNextMessage = Shortcuts ? (
        <>
            {c('Title').t`Next message`}
            <br />
            <kbd className="no-border">J</kbd>
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
                className="no-tablet no-mobile"
                icon={
                    <Icon
                        className="rotateZ-90"
                        name="caret"
                        alt={conversationMode ? c('Action').t`Previous conversation` : c('Action').t`Previous message`}
                    />
                }
            />
            <ToolbarButton
                disabled={loading || index >= elementIDs.length - 1}
                title={conversationMode ? titleNextConversation : titleNextMessage}
                onClick={handleNext}
                className="no-tablet no-mobile"
                icon={
                    <Icon
                        className="rotateZ-270"
                        name="caret"
                        alt={conversationMode ? c('Action').t`Next conversation` : c('Action').t`Next message`}
                    />
                }
            />
        </>
    );
};

export default NavigationControls;
