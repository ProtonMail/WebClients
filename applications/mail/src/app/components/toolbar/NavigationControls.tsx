import React from 'react';
import { Icon, ToolbarButton } from 'react-components';
import { c } from 'ttag';

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
