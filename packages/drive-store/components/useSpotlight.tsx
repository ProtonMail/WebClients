import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { FeatureCode, useSpotlightOnFeature, useSpotlightShow } from '@proton/components';

import type { DriveFolder } from '../hooks/drive/useActiveShare';
import { useLinksListing } from '../store/_links';
import { useDefaultShare } from '../store/_shares';
import { sendErrorReport } from '../utils/errorHandling';

const SEARCH_DISCOVERY_FILES_THRESHOLD = 5;

type SpotlightContextFunctions = {
    searchSpotlight: {
        isOpen: boolean;
        onDisplayed: () => void;
        close: () => void;
    };
};

interface Props {
    children?: ReactNode;
}

const SpotlightContext = createContext<SpotlightContextFunctions | null>(null);

const useSearchSpotlight = () => {
    const [rootFolder, setRootFolder] = useState<DriveFolder>();
    const { getDefaultShare } = useDefaultShare();
    const { getCachedChildrenCount } = useLinksListing();

    useEffect(() => {
        getDefaultShare()
            .then(({ shareId, rootLinkId }) => {
                setRootFolder({ shareId, linkId: rootLinkId });
            })
            .catch(sendErrorReport);
    }, []);

    const storedItemsCount = useMemo(() => {
        if (!rootFolder?.linkId || !rootFolder?.shareId) {
            return 0;
        }
        return getCachedChildrenCount(rootFolder.shareId, rootFolder.linkId);
    }, [rootFolder, getCachedChildrenCount]);

    const enoughItemsStored = storedItemsCount > SEARCH_DISCOVERY_FILES_THRESHOLD;

    const {
        show: showSpotlight,
        onDisplayed,
        onClose,
    } = useSpotlightOnFeature(FeatureCode.DriveSearchSpotlight, enoughItemsStored);
    const shouldShowSpotlight = useSpotlightShow(showSpotlight);

    return {
        isOpen: shouldShowSpotlight,
        onDisplayed,
        close: onClose,
    };
};

export const SpotlightProvider = ({ children }: Props) => {
    const searchSpotlight = useSearchSpotlight();

    const value = {
        searchSpotlight,
    };

    return <SpotlightContext.Provider value={value}>{children}</SpotlightContext.Provider>;
};

export function useSpotlight() {
    const state = useContext(SpotlightContext);
    if (!state) {
        throw new Error('Trying to use uninitialized SearchLibraryProvider');
    }
    return state;
}
