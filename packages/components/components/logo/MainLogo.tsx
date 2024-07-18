import { AppLink, AppLinkProps } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { useConfig } from '../../hooks';
import Logo, { LogoVariant } from './Logo';

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
