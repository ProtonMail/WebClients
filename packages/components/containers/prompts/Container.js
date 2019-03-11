import PropTypes from 'prop-types';

const PromptsContainer = ({ prompts }) => {
    return prompts.map(({ component }) => {
        return component;
    });
};

PromptsContainer.propTypes = {
    prompts: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default PromptsContainer;
