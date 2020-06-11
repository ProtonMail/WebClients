import React from 'react';
import { Icon } from 'react-components';
import { c } from 'ttag';

import ToolbarButton from './ToolbarButton';

import { Element } from '../../models/element';

interface Props {
    loading: boolean;
    conversationMode: boolean;
    elementID?: string;
    elements: Element[];
    onElement: (element: Element) => void;
}

const NavigationControls = ({ loading, conversationMode, elementID, elements, onElement }: Props) => {
    const index = elements.findIndex((element) => element.ID === elementID);

    const handleNext = () => onElement(elements[index + 1]);
    const handlePrevious = () => onElement(elements[index - 1]);

    return (
        <>
            <ToolbarButton
                loading={loading}
                disabled={index <= 0}
                title={conversationMode ? c('Title').t`Previous conversation` : c('Title').t`Previous message`}
                onClick={handlePrevious}
                className="notablet nomobile"
            >
                <Icon className="toolbar-icon rotateZ-90 mauto" name="caret" />
            </ToolbarButton>
            <ToolbarButton
                loading={loading}
                disabled={index >= elements.length - 1}
                title={conversationMode ? c('Title').t`Next conversation` : c('Title').t`Next message`}
                onClick={handleNext}
                className="notablet nomobile"
            >
                <Icon className="toolbar-icon rotateZ-270 mauto" name="caret" />
            </ToolbarButton>
        </>
    );
};

export default NavigationControls;
