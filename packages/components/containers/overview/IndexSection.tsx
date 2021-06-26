import React from 'react';

import { Icon } from '../../components';
import { usePermissions } from '../../hooks';
import { classnames } from '../../helpers';

import Sections from './Sections';
import { SectionConfig } from '../../components/layout';

const IndexSection = ({ pages, limit = 4 }: { pages: SectionConfig[]; limit?: number }) => {
    const permissions = usePermissions();
    return (
        <div className="overview-grid">
            {pages.map(({ icon, text, to, subsections = [], permissions: pagePermissions }) => {
                return (
                    <section
                        key={to}
                        className={classnames([
                            'overview-grid-item bordered bg-norm shadow-norm p2',
                            subsections.length > limit && 'overview-grid-item--tall',
                        ])}
                    >
                        <h2 className="h6 mb1 flex flex-align-items-center flex-nowrap">
                            <Icon name={icon} className="mr0-5 flex-item-noshrink" />
                            <strong className="text-ellipsis" title={text}>
                                {text}
                            </strong>
                        </h2>
                        <Sections
                            to={to}
                            subsections={subsections}
                            text={text}
                            permissions={permissions}
                            pagePermissions={pagePermissions}
                        />
                    </section>
                );
            })}
        </div>
    );
};

export default IndexSection;
