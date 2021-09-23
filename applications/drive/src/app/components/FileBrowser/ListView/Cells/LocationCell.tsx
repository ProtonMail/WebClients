import { useEffect, useState } from 'react';
import useWorkingDirectory from '../../../../hooks/drive/useWorkingDirectory';

interface Props {
    shareId: string;
    parentLinkId: string;
}

const LocationCell = ({ shareId, parentLinkId }: Props) => {
    const [location, setLocation] = useState<string>();
    const path = useWorkingDirectory();

    useEffect(() => {
        path.traverseLinksToRoot(shareId, parentLinkId)
            .then((workingDirectory) => {
                setLocation(`/${workingDirectory.map(path.getLinkName).join('/')}`);
            })
            .catch(console.error);
    }, [shareId, parentLinkId]);

    return (
        <div key="location" title={location} className="text-ellipsis">
            <span className="text-pre">{location}</span>
        </div>
    );
};

export default LocationCell;
