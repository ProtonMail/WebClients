import type { ReactNode } from 'react';

import { Banner } from '@proton/atoms/Banner/Banner';

interface Props {
    icon: React.JSX.Element;
    children: ReactNode;
}

const GroupInfoBanner = ({ icon, children }: Props) => {
    return (
        <Banner icon={icon} contentWrapperClassName="flex items-center">
            <span className="color-weak">{children}</span>
        </Banner>
    );
};

export default GroupInfoBanner;
