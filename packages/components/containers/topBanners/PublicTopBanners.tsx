import { ReactNode } from 'react';
import OnlineTopBanner from './OnlineTopBanner';
import BadAppVersionBanner from './BadAppVersionBanner';
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
