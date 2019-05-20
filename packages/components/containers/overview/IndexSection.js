import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { useUser } from 'react-components';

const Sections = ({ route, sections = [], text }) => {
    return (
        <ul className="unstyled mt0-5">
            {sections.length ? (
                sections
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
                    })
            ) : (
                <li>
                    <Link to={route}>{text}</Link>
                </li>
            )}
        </ul>
    );
};

Sections.propTypes = {
    route: PropTypes.string,
    sections: PropTypes.array,
    text: PropTypes.string
};

const IndexSection = ({ pages }) => {
    const [{ hasPaidMail } = {}] = useUser();
    return (
        <div className="settings-grid-container">
            {pages
                .filter(({ paidFeature }) => {
                    if (hasPaidMail) {
                        return true;
                    }
                    return !paidFeature;
                })
                .map(({ text, route, sections = [] }) => {
                    return (
                        <div key={route} className={`setting-grid ${sections.length > 4 ? 'setting-grid--tall' : ''}`}>
                            <h2 className="h6 mb0-5">
                                <strong>{text}</strong>
                            </h2>
                            {Sections({ route, sections, text })}
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
