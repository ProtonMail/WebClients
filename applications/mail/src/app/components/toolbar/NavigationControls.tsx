import React from 'react';
import { Icon } from 'react-components';
import { c } from 'ttag';

import ToolbarButton from './ToolbarButton';

interface Props {
    loading: boolean;
    conversationMode: boolean;
    elementID?: string;
    elementIDs: string[];
    onElement: (elementID: string | undefined) => void;
}

const NavigationControls = ({ loading, conversationMode, elementID, elementIDs, onElement }: Props) => {
    const index = elementIDs.findIndex((id) => id === elementID);

    const handleNext = () => onElement(elementIDs[index + 1]);
    const handlePrevious = () => onElement(elementIDs[index - 1]);

    return (
        <>
            <ToolbarButton
                loading={loading}
                disabled={index <= 0}
                title={conversationMode ? c('Title').t`Previous conversation` : c('Title').t`Previous message`}
                onClick={handlePrevious}
                className="no-tablet no-mobile"
            >
                <Icon className="toolbar-icon rotateZ-90 mauto" name="caret" />
                <span className="sr-only">
                    {conversationMode ? c('Action').t`Previous conversation` : c('Action').t`Previous message`}
                </span>
            </ToolbarButton>
            <ToolbarButton
                loading={loading}
                disabled={index >= elementIDs.length - 1}
                title={conversationMode ? c('Title').t`Next conversation` : c('Title').t`Next message`}
                onClick={handleNext}
                className="no-tablet no-mobile"
            >
                <Icon className="toolbar-icon rotateZ-270 mauto" name="caret" />
                <span className="sr-only">
                    {conversationMode ? c('Action').t`Next conversation` : c('Action').t`Next message`}
                </span>
            </ToolbarButton>
        </>
    );
};

export default NavigationControls;
