import { useEffect, useRef, useState } from 'react';

import { Icon } from '@proton/components';

import { useLinkPath } from '../../../../store';

interface Props {
    shareId: string;
    parentLinkId: string;
    isTrashed?: boolean;
}

export const LocationCell = ({ shareId, parentLinkId, isTrashed }: Props) => {
    const [location, setLocation] = useState<string>();
    const { getPath } = useLinkPath();

    const abortController = useRef(new AbortController());
    const previousParentLinkId = useRef(parentLinkId);

    useEffect(() => {
        void getPath(abortController.current.signal, shareId, parentLinkId).then(setLocation);

        return () => {
            // Abort only when parent ID changes which means the whole location
            // changed and is not needed anymore. All other cases we just want
            // to update location based on the latest cache state.
            if (previousParentLinkId.current !== parentLinkId) {
                abortController.current.abort();
                abortController.current = new AbortController();
                previousParentLinkId.current = parentLinkId;
            }
        };
    }, [getPath, shareId, parentLinkId]);

    return (
        <div key="location" title={location} className="text-ellipsis">
            <span className="text-pre">
                {isTrashed && <Icon name="trash" className="mr-1" />}
                {location}
            </span>
        </div>
    );
};
