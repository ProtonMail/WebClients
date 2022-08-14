import { ReactNode } from 'react';

import BadAppVersionBanner from './BadAppVersionBanner';
import OnlineTopBanner from './OnlineTopBanner';
import TorWarningBanner from './TorWarningBanner';

interface Props {
    children?: ReactNode;
}

const PublicTopBanners = ({ children }: Props) => {
    return (
        <>
            <TorWarningBanner />
            <OnlineTopBanner />
            <BadAppVersionBanner />
            {children}
        </>
    );
};

export default PublicTopBanners;
