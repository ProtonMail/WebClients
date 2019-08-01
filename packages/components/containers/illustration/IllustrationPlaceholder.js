import React from 'react';
import PropTypes from 'prop-types';

const IllustrationPlaceholder = ({ className, title, text = '', url, uppercase, children }) => {
    const info = typeof text === 'string' ? <p>{text}</p> : text;

    return (
        <div className={`flex flex-column flex-items-center w100 ${className}`}>
            <img src={url} alt={title} className="p1 mb1" />
            <h2 className={`bold ${uppercase ? 'uppercase' : ''}`}>{title}</h2>
            {info}
            {children}
        </div>
    );
};

IllustrationPlaceholder.propTypes = {
    className: PropTypes.string,
    title: PropTypes.string.isRequired,
    text: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    url: PropTypes.string.isRequired,
    uppercase: PropTypes.bool,
    children: PropTypes.node
};

export default IllustrationPlaceholder;
