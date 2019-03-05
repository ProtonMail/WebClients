import React from 'react';
import PropTypes from 'prop-types';

const Breadcrumb = ({ list, current, onClick }) => {
    const handleClick = (index) => () => {
        if (onClick) {
            onClick(index);
        }
    };

    return (
        <div className="breadcrumb-container">
            {list.map((item, index) => {
                return (
                    <button
                        disabled={index === current}
                        aria-current={current === index ? 'step' : false}
                        onClick={handleClick(index)}
                        key={index.toString()}
                        className="breadcrumb-item"
                    >
                        {item}
                    </button>
                );
            })}
        </div>
    );
};

Breadcrumb.propTypes = {
    onClick: PropTypes.func,
    list: PropTypes.array.isRequired,
    current: PropTypes.number.isRequired
};

Breadcrumb.defaultProps = {
    current: 0
};

export default Breadcrumb;
