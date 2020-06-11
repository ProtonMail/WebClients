import React from 'react';
import { usePermissions } from '../../index';
import { classnames } from '../../helpers/component';

import Sections from './Sections';
import { SectionConfig } from '../../components/layout';

const IndexSection = ({ pages }: { pages: SectionConfig[] }) => {
    const permissions = usePermissions();
    return (
        <div className="settings-grid-container">
            {pages.map(({ text, link, subsections = [], permissions: pagePermissions }) => {
                return (
                    <div
                        key={link}
                        className={classnames(['setting-grid', subsections.length > 4 && 'setting-grid--tall'])}
                    >
                        <h2 className="h6 mb0-5">
                            <strong>{text}</strong>
                        </h2>
                        <Sections
                            link={link}
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
