import { useEffect, useState } from 'react';

import { useLinkPath } from '../../../../store';

interface Props {
    shareId: string;
    parentLinkId: string;
}

const LocationCell = ({ shareId, parentLinkId }: Props) => {
    const [location, setLocation] = useState<string>();
    const { getPath } = useLinkPath();

    useEffect(() => {
        const abortController = new AbortController();

        void getPath(abortController.signal, shareId, parentLinkId).then(setLocation);

        return () => {
            abortController.abort();
        };
    }, [shareId, parentLinkId]);

    return (
        <div key="location" title={location} className="text-ellipsis">
            <span className="text-pre">{location}</span>
        </div>
    );
};

export default LocationCell;
