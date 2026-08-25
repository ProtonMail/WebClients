import { useConfig } from '@proton/app-context/useConfig';
import clsx from '@proton/utils/clsx';

import type { AppLinkProps } from '../link/AppLink';
import AppLink from '../link/AppLink';
import Logo from './Logo';
import type { LogoVariant } from './LogoBase';

const MainLogo = (props: AppLinkProps & { className?: string; variant?: LogoVariant }) => {
    const { APP_NAME } = useConfig();

    return (
        <AppLink
            toApp={APP_NAME}
            target="_self"
            className={clsx('relative interactive-pseudo-protrude interactive--no-background', props.className)}
            {...props}
        >
            <Logo variant={props.variant} appName={APP_NAME} />
        </AppLink>
    );
};

export default MainLogo;
