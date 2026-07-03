import type { ReactNode } from 'react';

import { Banner } from '@proton/atoms/Banner/Banner';
import { Href } from '@proton/atoms/Href/Href';

interface Props {
    icon: React.JSX.Element;
    children: ReactNode;
}

const GroupInfoBanner = ({ icon, children }: Props) => {
    const showLearnMoreLink = false; // TO BE REMOVED: for now we just do not show link

    return (
        <Banner icon={icon} contentWrapperClassName="flex items-center">
            <span className="flex gap-1">
                {children}
                {/* TODO: link should be updated once we have knowledge page for scim */}
                {showLearnMoreLink && (
                    <Href href="https://proton.me/support/groups" className="color-primary inline-block">
                        PLEASE UPDATE ME
                    </Href>
                )}
            </span>
        </Banner>
    );
};

export default GroupInfoBanner;
