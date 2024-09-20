import Logo from '@proton/components/components/logo/Logo';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import './CustomLogo.scss';

type Props = {
    organizationName: string;
    app: APP_NAMES;
    url: string;
    className?: string;
    collapsed?: boolean;
    style?: React.CSSProperties;
    organizationNameDataTestId?: string;
};

const CustomLogo = ({
    url,
    app,
    organizationName,
    className,
    collapsed = false,
    style,
    organizationNameDataTestId,
    ...rest
}: Props) => {
    const longOrgName = organizationName.length >= 9;

    const ProcessedOrgName = () => {
        return (
            <span
                title={organizationName}
                data-testid={organizationNameDataTestId}
                className={clsx(
                    'text-semibold text-ellipsis w-full text-no-decoration sidebar-custom-logo-name',
                    longOrgName ? 'text-rg' : 'text-lg'
                )}
            >
                {organizationName}
            </span>
        );
    };

    return (
        <div
            className={clsx(
                'relative w-full text-no-decoration flex flex-nowrap gap-2 rounded-lg interactive-pseudo-protrude interactive--no-background sidebar-custom-logo',
                className
            )}
            style={style}
            {...rest}
        >
            <div
                className="rounded ratio-square overflow-hidden w-custom shrink-0 grow-0 relative sidebar-custom-logo-image"
                style={{ '--w-custom': '2.25rem' }}
            >
                <img src={url} alt="" className="object-cover w-full h-full" />
            </div>
            {!collapsed && (
                <div className={clsx('flex flex-column justify-center', longOrgName ? 'mb-1' : 'mb-0.5')}>
                    <ProcessedOrgName />
                    <div className="h-custom flex" style={{ '--h-custom': '0.625rem' }}>
                        <Logo
                            appName={app}
                            variant="wordmark-only"
                            className="color-norm opacity-70 ml-px h-full w-auto"
                            style={{ '--h-custom': '0.625rem' }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomLogo;
