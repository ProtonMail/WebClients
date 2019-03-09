import React from 'react';
import PropTypes from 'prop-types';

const Breadcrumb = ({ list, current, onClick }) => {
    const handleClick = (index) => () => {
        if (onClick) {
            onClick(index);
        }
    };

    return (
        <ul className="breadcrumb-container unstyled inline-flex pl0-5 pr0-5">
            {list.map((item, index) => {
                const key = index.toString();
                return (
                    <li className="breadcrumb-item" key={key}>
                        <button
                            type="button"
                            disabled={index === current}
                            aria-current={current === index ? 'step' : false}
                            onClick={handleClick(index)}
                            key={key}
                            className="breadcrumb-button"
                        >
                            {item}
                        </button>
                    </li>
                );
            })}
        </ul>
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
