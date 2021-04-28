import React from 'react';
import { c } from 'ttag';
import { Location } from 'history';
import { Icon, ToolbarButton } from 'react-components';
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

    return (
        <>
            <ToolbarButton
                disabled={loading || index <= 0}
                title={conversationMode ? c('Title').t`Previous conversation` : c('Title').t`Previous message`}
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
                title={conversationMode ? c('Title').t`Next conversation` : c('Title').t`Next message`}
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
