import * as React from 'react';
import {
    usePermissions,
    Paragraph,
    SettingsPropsShared,
    PrivateMainSettingsArea,
    SectionConfig,
} from '@proton/components';
import { c } from 'ttag';
import { Link } from 'react-router-dom';
import { hasPermission } from '@proton/shared/lib/helpers/permissions';
import upgradeSvg from '@proton/styles/assets/img/placeholders/upgrade.svg';

interface Props extends SettingsPropsShared {
    config: SectionConfig;
    children?: React.ReactNode;
}

const PrivateMainSettingsAreaWithPermissions = ({ config, location, children, setActiveSection }: Props) => {
    const userPermissions = usePermissions();
    const { subsections = [], permissions: pagePermissions = [], text } = config;

    const noPermissionChild = (() => {
        if (!hasPermission(userPermissions, pagePermissions)) {
            return (
                <div id="page-error" className="text-center">
                    <img src={upgradeSvg} alt={c('Title').t`Upgrade`} className="mb2" />
                    <Paragraph>
                        {c('Info')
                            .t`Upgrade to a paid plan to access premium features and increase your storage space.`}
                    </Paragraph>
                    <Link to="/dashboard">{c('Link').t`Upgrade now`}</Link>
                </div>
            );
        }
    })();

    const childrenWithPermission = React.Children.toArray(children)
        .filter(React.isValidElement)
        .map((child, index) => {
            const { permissions: sectionPermissions } = subsections[index];
            return React.cloneElement(child, {
                // @ts-ignore
                permission: hasPermission(userPermissions, sectionPermissions),
            });
        });

    return (
        <PrivateMainSettingsArea
            title={text}
            location={location}
            setActiveSection={setActiveSection}
            subsections={noPermissionChild ? [] : subsections}
        >
            {noPermissionChild || childrenWithPermission}
        </PrivateMainSettingsArea>
    );
};

export default PrivateMainSettingsAreaWithPermissions;
