import React from 'react';
import { Alert, usePermissions, SettingsPropsShared, PrivateMainSettingsArea, SectionConfig } from 'react-components';
import { hasPermission } from 'proton-shared/lib/helpers/permissions';
import { c } from 'ttag';
import { Link } from 'react-router-dom';

interface Props extends SettingsPropsShared {
    config: SectionConfig;
    children?: React.ReactNode;
}

const PrivateMainSettingsAreaWithPermissions = ({ config, location, children, setActiveSection }: Props) => {
    const userPermissions = usePermissions();
    const { subsections = [], permissions: pagePermissions, text } = config;

    const noPermissionChild = (() => {
        if (!hasPermission(userPermissions, pagePermissions)) {
            return (
                <div id="page-error" className="aligncenter">
                    <h3 className="bold">{c('Title').t`Sorry, you can't access this page`}</h3>
                    <div className="container-section-sticky">
                        <Alert>
                            <Link to="/settings/subscription">{c('Link').t`Upgrade now`}</Link>
                        </Alert>
                    </div>
                </div>
            );
        }
    })();

    const childrenWithPermission = React.Children.toArray(children)
        .filter(React.isValidElement)
        .map((child, index) => {
            const { permissions: sectionPermissions } = subsections[index];
            return React.cloneElement(child, {
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                permission: hasPermission(userPermissions, sectionPermissions)
            });
        });

    return (
        <PrivateMainSettingsArea
            title={text}
            appName="ProtonVPN"
            location={location}
            setActiveSection={setActiveSection}
            subsections={noPermissionChild ? [] : subsections}
        >
            {noPermissionChild || childrenWithPermission}
        </PrivateMainSettingsArea>
    );
};

export default PrivateMainSettingsAreaWithPermissions;
