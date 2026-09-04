import { useScreenShareLabel } from '../../../hooks/screenShare/useScreenShareLabel';
import { ScreenShareView } from './shared/ScreenShareView';
import { SpotlightLayout } from './shared/SpotlightLayout';

export const ShareScreenLayout = () => {
    const screenShareLabel = useScreenShareLabel();

    return (
        <SpotlightLayout ariaLabel={screenShareLabel}>
            <ScreenShareView />
        </SpotlightLayout>
    );
};
