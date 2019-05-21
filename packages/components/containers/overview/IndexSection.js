import React from 'react';
import PropTypes from 'prop-types';
import { usePermissions } from 'react-components';

import Sections from './Sections';

const IndexSection = ({ pages }) => {
    const permissions = usePermissions();
    return (
        <div className="settings-grid-container">
            {pages.map(({ text, route, sections = [], permissions: pagePermissions }) => {
                return (
                    <div key={route} className={`setting-grid ${sections.length > 4 ? 'setting-grid--tall' : ''}`}>
                        <h2 className="h6 mb0-5">
                            <strong>{text}</strong>
                        </h2>
                        {Sections({ route, sections, text, permissions, pagePermissions })}
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
