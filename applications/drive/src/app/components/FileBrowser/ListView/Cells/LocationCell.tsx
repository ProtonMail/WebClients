import React, { useEffect, useState } from 'react';
import { c } from 'ttag';
import useDrive from '../../../../hooks/drive/useDrive';

interface Props {
    shareId: string;
    parentLinkId: string;
}

const LocationCell = ({ shareId, parentLinkId }: Props) => {
    const [location, setLocation] = useState<string>();
    const { getLinkMeta } = useDrive();

    useEffect(() => {
        const getLocationItems = async (shareId: string, linkId: string): Promise<string[]> => {
            const { ParentLinkID, Name } = await getLinkMeta(shareId, linkId);
            if (!ParentLinkID) {
                return [c('Title').t`My files`];
            }

            const previous = await getLocationItems(shareId, ParentLinkID);
            return [...previous, Name];
        };

        getLocationItems(shareId, parentLinkId)
            .then((items: string[]) => `/${items.join('/')}`)
            .then(setLocation)
            .catch(console.error);
    }, [shareId, parentLinkId]);

    return (
        <div key="location" title={location} className="text-ellipsis">
            <span className="text-pre">{location}</span>
        </div>
    );
};

export default LocationCell;
