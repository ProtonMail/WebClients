import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from 'react-components';

import ToolbarButton from './ToolbarButton';

interface Props {
    onClick: () => void;
}

const BackButton = ({ onClick }: Props) => {
    return (
        <ToolbarButton onClick={onClick}>
            <Icon className="toolbar-icon mauto" name="arrow-left" />
        </ToolbarButton>
    );
};

BackButton.propTypes = {
    onClick: PropTypes.func.isRequired
};

export default BackButton;
