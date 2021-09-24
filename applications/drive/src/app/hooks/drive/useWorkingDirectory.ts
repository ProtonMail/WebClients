import { c } from 'ttag';
import { LinkMeta } from '../../interfaces/link';
import useDrive from './useDrive';

const useWorkingDirectory = () => {
    const { getLinkMeta } = useDrive();
    const rootDefaultName = c('Title').t`My files`;

    const traverseLinksToRoot = async (shareId: string, linkId: string) => {
        const currentLinkMeta = await getLinkMeta(shareId, linkId);
        const path = [currentLinkMeta];
        let nextLinkId = currentLinkMeta.ParentLinkID;

        while (nextLinkId) {
            const linkMeta = await getLinkMeta(shareId, nextLinkId);
            path.unshift(linkMeta);
            nextLinkId = linkMeta.ParentLinkID;
        }

        return path;
    };

    const getLinkName = (linkMeta: LinkMeta) => {
        return linkMeta.ParentLinkID ? linkMeta.Name : rootDefaultName;
    };

    return {
        traverseLinksToRoot,
        getLinkName,
    };
};

export default useWorkingDirectory;
