import type { AppLinkProps } from '@proton/components/components/link/AppLink';
import AppLink from '@proton/components/components/link/AppLink';
import CustomLogo from '@proton/components/components/logo/CustomLogo';
import MainLogo from '@proton/components/components/logo/MainLogo';
import { useOrganizationTheme } from '@proton/components/containers/organization/logoUpload/useOrganizationTheme';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

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
