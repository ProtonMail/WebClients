import Spotlight from '@proton/components/components/spotlight/Spotlight';

import { useProtonMeetSpotlight } from '../../hooks/useProtonMeetSpotlight';

interface ProtonMeetSpotlightWrapperProps {
    children: React.ReactNode;
}

export const ProtonMeetSpotlightWrapper = ({ children }: ProtonMeetSpotlightWrapperProps) => {
    const { shouldShowSpotlight, onDisplayed, onClose, spotlightContent } = useProtonMeetSpotlight();

    return (
        <Spotlight
            content={spotlightContent}
            className="ml-2"
            show={shouldShowSpotlight}
            onDisplayed={onDisplayed}
            originalPlacement="left"
            onClose={onClose}
        >
            <div onClick={onClose}>{children}</div>
        </Spotlight>
    );
};
