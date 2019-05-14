import React from 'react';
import PropTypes from 'prop-types';
import Icon from '../icon/Icon';

const AutocompleteSelection = ({ className, label, onRemove, onLabelChange }) => {
    const editable = !!onLabelChange;

    const handleBlur = (e) => {
        onLabelChange(e.target.textContent);
    };

    const handleKeyDown = (e) => {
        if (editable && e.key === 'Enter') {
            e.preventDefault();
            onLabelChange(e.target.textContent);
            e.target.blur();
        }
    };

    return (
        <div className={`flex bordered-container bg-global-light mr0-5 ${className}`}>
            <div
                className="flex ml0-5 mr0-5 flex-item-centered-vert"
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                contentEditable={true}
                suppressContentEditableWarning={true}
            >
                {label}
            </div>
            <button
                type="button"
                className="flex bordered-container autocompleteSelection-closeButton"
                onClick={onRemove}
            >
                <Icon className="center" name="close" />
            </button>
        </div>
    );
};

AutocompleteSelection.propTypes = {
    className: PropTypes.string,
    label: PropTypes.node,
    onRemove: PropTypes.func,
    onLabelChange: PropTypes.func
};

export default AutocompleteSelection;
