import { APP_NAMES } from '@proton/shared/lib/constants';

import { AppLink, AppLinkProps, CustomLogo, MainLogo } from '../';
import { useOrganizationTheme } from '../../containers/organization/logoUpload';

interface Props extends AppLinkProps {
    app: APP_NAMES;
}

const SidebarLogo = ({ app, ...rest }: Props) => {
    const organizationTheme = useOrganizationTheme();

    if (organizationTheme.logoURL && organizationTheme.showName) {
        return (
            <AppLink
                toApp={app}
                target="_self"
                className="relative interactive-pseudo-protrude interactive--no-background text-no-decoration rounded-lg"
                {...rest}
            >
                <CustomLogo url={organizationTheme.logoURL} app={app} organizationName={organizationTheme.name} />
            </AppLink>
        );
    }

    return <MainLogo {...rest} data-testid="main-logo" />;
};

export default SidebarLogo;
