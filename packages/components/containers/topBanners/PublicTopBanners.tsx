import OnlineTopBanner from './OnlineTopBanner';
import BadAppVersionBanner from './BadAppVersionBanner';
import TorWarningBanner from './TorWarningBanner';

const PublicTopBanners = () => {
    return (
        <>
            <TorWarningBanner />
            <OnlineTopBanner />
            <BadAppVersionBanner />
        </>
    );
};

export default PublicTopBanners;
