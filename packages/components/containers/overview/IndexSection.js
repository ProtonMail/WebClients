import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const Sections = ({ route, sections = [] }) => {
    return (
        <ul className="unstyled mt0-5">
            {sections
                .reduce((acc, { text, id }) => {
                    acc.push({ text, id, route: `${route}#${id}` });
                    return acc;
                }, [])
                .map(({ text, id, route }) => {
                    return (
                        <li key={id}>
                            <Link to={route}>{text}</Link>
                        </li>
                    );
                })}
        </ul>
    );
};

Sections.propTypes = {
    route: PropTypes.string,
    sections: PropTypes.array
};

const IndexSection = ({ pages }) => {
    return (
        <div className="settings-grid-container">
            {pages.map(({ text, route, sections = [] }) => {
                return (
                    <div key={route} className={`setting-grid ${sections.length > 4 ? 'setting-grid--tall' : ''}`}>
                        <h2 className="h6 mb0-5">
                            <strong>{text}</strong>
                        </h2>
                        {Sections({ route, sections })}
                    </div>
                );
            })}
        </div>
    );
};

IndexSection.propTypes = {
    pages: PropTypes.array
};

export default IndexSection;
