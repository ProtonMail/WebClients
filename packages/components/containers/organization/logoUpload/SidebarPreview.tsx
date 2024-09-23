import { CustomLogo, Logo } from '@proton/components';
import Icon from '@proton/components/components/icon/Icon';
import type { APP_NAMES } from '@proton/shared/lib/constants';

import './SidebarPreview.scss';

type Props = {
    imageUrl?: string;
    organizationName?: string;
    variant?: 'dark' | 'light';
    organizationNameDataTestId?: string;
    app: APP_NAMES;
};

const SidebarPreview = ({ imageUrl, organizationName, organizationNameDataTestId, variant = 'light', app }: Props) => {
    const colors = {
        dark: {
            background: '#1B1340',
            name: '#fff',
            border: '#413085',
            icon: '#B3A3F5',
            iconBorder: '#fff',
        },
        light: {
            background: '#FFF',
            name: '#0C0C14',
            border: '#D1CFCD',
            icon: '#5C5958',
            iconBorder: '#000',
        },
    };

    return (
        <div
            style={{ backgroundColor: colors[variant].background, borderColor: colors[variant].border }}
            className="sidebar-logo-preview w-full px-4 py-3 shadow-raised rounded border flex justify-space-between items-center flex-nowrap gap-0.5"
        >
            {imageUrl && organizationName ? (
                <CustomLogo
                    url={imageUrl}
                    app={app}
                    organizationName={organizationName}
                    organizationNameDataTestId={organizationNameDataTestId}
                    className="pointer-events-none"
                    style={{
                        '--sidebar-custom-logo-border-color': colors[variant].iconBorder,
                        '--logo-text-proton-color': colors[variant].name,
                    }}
                />
            ) : (
                <Logo appName={app} className="" style={{ '--logo-text-proton-color': colors[variant].name }} />
            )}
            <div
                className="w-custom flex items-center justify-center shrink-0 ratio-square"
                style={{ '--w-custom': '2.25rem' }}
            >
                <Icon name="app-switch" className="shrink-0" style={{ color: colors[variant].icon }} size={6} />
            </div>
        </div>
    );
};

export default SidebarPreview;
