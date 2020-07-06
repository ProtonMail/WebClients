import React from 'react';
import { Icon } from 'react-components';
import { c } from 'ttag';

import ToolbarButton from './ToolbarButton';

interface Props {
    onClick: () => void;
}

const BackButton = ({ onClick }: Props) => {
    return (
        <ToolbarButton onClick={onClick}>
            <Icon className="toolbar-icon mauto" name="arrow-left" />
            <span className="sr-only">{c('Action').t`Back`}</span>
        </ToolbarButton>
    );
};

export default BackButton;
