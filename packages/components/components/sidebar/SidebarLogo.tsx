import { AppLink, CustomLogo, MainLogo } from '@proton/components';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import type { AppLinkProps } from '../';
import { useOrganizationTheme } from '../../containers/organization/logoUpload/useOrganizationTheme';

interface Props extends AppLinkProps {
    app: APP_NAMES;
    collapsed?: boolean;
}

const SidebarLogo = ({ app, collapsed = false, ...rest }: Props) => {
    const organizationTheme = useOrganizationTheme();

    if (organizationTheme.logoURL && organizationTheme.showName) {
        return (
            <AppLink
                toApp={app}
                target="_self"
                className={clsx(
                    'relative interactive-pseudo-protrude interactive--no-background text-no-decoration rounded-lg',
                    collapsed && 'mt-3'
                )}
                {...rest}
            >
                <CustomLogo
                    url={organizationTheme.logoURL}
                    app={app}
                    collapsed={collapsed}
                    organizationName={organizationTheme.name}
                    organizationNameDataTestId="sidebar:organization-name"
                />
            </AppLink>
        );
    }

    if (collapsed) {
        return <MainLogo variant="glyph-only" className="mt-3" {...rest} data-testid="main-logo" />;
    }

    return <MainLogo {...rest} data-testid="main-logo" />;
};

export default SidebarLogo;
