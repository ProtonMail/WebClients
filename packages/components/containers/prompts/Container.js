import React from 'react';
import PropTypes from 'prop-types';

const PromptsContainer = ({ prompts }) => {
    return prompts.map(({ id, component }) => {
        return <React.Fragment key={id}>{component}</React.Fragment>;
    });
};

PromptsContainer.propTypes = {
    prompts: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default PromptsContainer;
