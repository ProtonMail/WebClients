import useDriveNavigation from '../hooks/drive/useNavigate';
import { useSpotlight } from './useSpotlight';

const useOpenPreview = () => {
    const { navigateToLink } = useDriveNavigation();
    const spotlight = useSpotlight();

    const openPreview = (shareId: string, linkId: string) => {
        spotlight.searchSpotlight.close();
        navigateToLink(shareId, linkId, true);
    };

    return openPreview;
};

export default useOpenPreview;
