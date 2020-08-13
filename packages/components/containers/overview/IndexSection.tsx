import React from 'react';
import { usePermissions } from '../../hooks';
import { classnames } from '../../helpers';

import Sections from './Sections';
import { SectionConfig } from '../../components/layout';

const IndexSection = ({ pages }: { pages: SectionConfig[] }) => {
    const permissions = usePermissions();
    return (
        <div className="settings-grid-container">
            {pages.map(({ text, to, subsections = [], permissions: pagePermissions }) => {
                return (
                    <div
                        key={to}
                        className={classnames(['setting-grid', subsections.length > 4 && 'setting-grid--tall'])}
                    >
                        <h2 className="h6 mb0-5">
                            <strong>{text}</strong>
                        </h2>
                        <Sections
                            to={to}
                            subsections={subsections}
                            text={text}
                            permissions={permissions}
                            pagePermissions={pagePermissions}
                        />
                    </div>
                );
            })}
        </div>
    );
};

export default IndexSection;
