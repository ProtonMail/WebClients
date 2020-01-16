import React, { Children, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Alert, ObserverSections, SettingsTitle, usePermissions } from 'react-components';
import { hasPermission } from 'proton-shared/lib/helpers/permissions';
import { c } from 'ttag';
import { Link, withRouter } from 'react-router-dom';

import Main from './Main';

const Page = ({ config, location, children, setActiveSection }) => {
    const userPermissions = usePermissions();
    const { sections = [], permissions: pagePermissions, text } = config;
    const containerRef = useRef(null);

    useEffect(() => {
        document.title = `${text} - ProtonVPN`;
    }, [text]);

    useEffect(() => {
        if (!location.hash) {
            return;
        }

        // Need a delay to let the navigation ends
        const handle = setTimeout(() => {
            if (containerRef.current) {
                const el = containerRef.current.querySelector(location.hash);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        }, 100);

        return () => clearTimeout(handle);
    }, [location.hash]);

    if (!hasPermission(userPermissions, pagePermissions)) {
        return (
            <Main>
                <SettingsTitle>{text}</SettingsTitle>
                <div className="container-section-sticky">
                    <Alert>
                        <Link to="/settings/subscription">{c('Link').t`Upgrade now`}</Link>
                    </Alert>
                </div>
            </Main>
        );
    }

    return (
        <Main>
            <SettingsTitle>{text}</SettingsTitle>
            <div className="container-section-sticky" ref={containerRef}>
                <ObserverSections setActiveSection={setActiveSection}>
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
    );
};

Page.propTypes = {
    setActiveSection: PropTypes.func,
    config: PropTypes.object,
    children: PropTypes.node,
    location: PropTypes.object
};

export default withRouter(Page);
