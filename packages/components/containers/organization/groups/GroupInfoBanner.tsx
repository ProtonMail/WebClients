import type { ReactNode } from 'react';

import { Banner } from '@proton/atoms/Banner/Banner';
import { Href } from '@proton/atoms/Href/Href';

interface Props {
    icon: React.JSX.Element;
    children: ReactNode;
}

const GroupInfoBanner = ({ icon, children }: Props) => {
    return (
        <Banner icon={icon} contentWrapperClassName="flex items-center">
            <span className="color-weak">
                {children}
                {/* TODO: link should be updated once we have knowledge page for scim */}
                <Href href="https://proton.me/support/groups" className="ml-1 color-primary inline-block">
                    PLEASE UPDATE ME
                </Href>
            </span>
        </Banner>
    );
};

export default GroupInfoBanner;
