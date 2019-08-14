import React, { Children } from 'react';
import PropTypes from 'prop-types';
import { Alert, ObserverSections, SubSidebar, usePermissions } from 'react-components';
import { hasPermission } from 'proton-shared/lib/helpers/permissions';
import { c } from 'ttag';
import { Link } from 'react-router-dom';

import Main from './Main';
import Title from './Title';

const Page = ({ config, children }) => {
    const userPermissions = usePermissions();
    const { sections = [], permissions: pagePermissions, text } = config;

    if (!hasPermission(userPermissions, pagePermissions)) {
        return (
            <Main>
                <Title>{text}</Title>
                <div className="container-section-sticky">
                    <Alert>
                        <Link to="/settings/subscription">{c('Link').t`Upgrade now`}</Link>
                    </Alert>
                </div>
            </Main>
        );
    }

    return (
        <>
            {sections.length ? <SubSidebar list={sections} /> : null}
            <Main>
                <Title>{text}</Title>
                <div className="container-section-sticky">
                    <ObserverSections>
                        {Children.map(children, (child, index) => {
                            const { id, permissions: sectionPermissions = [] } = sections[index] || {};
                            return React.cloneElement(child, {
                                id,
                                permission: hasPermission(userPermissions, sectionPermissions)
                            });
                        })}
                    </ObserverSections>
                </div>
            </Main>
        </>
    );
};

Page.propTypes = {
    config: PropTypes.object,
    children: PropTypes.node
};

export default Page;
