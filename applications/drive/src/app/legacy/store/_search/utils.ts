import type { Location } from 'history';

import { getHashCode } from '@proton/shared/lib/helpers/string';
import type { ShareMapLink } from '@proton/shared/lib/interfaces/drive/link';

import type { ESLink } from './types';

export const createItemId = (shareId: string, linkId: string) => {
    return `${shareId}:${linkId}`;
};

export const parseItemId = (esItemId: string) => {
    const [shareId, linkId] = esItemId.split(':');
    return { shareId, linkId };
};

/**
 * Generate a deterministic numeric value based on the input
 */
export const generateOrder = (ID: string) => getHashCode(ID);

export const convertLinkToESItem = async (link: ShareMapLink, shareId: string): Promise<ESLink> => {
    const id = createItemId(shareId, link.LinkID);
    const order = await generateOrder(id);
    const processedLink = {
        id,
        createTime: link.CreateTime,
        decryptedName: link.Name,
        linkId: link.LinkID,
        MIMEType: link.MIMEType,
        modifiedTime: link.ModifyTime,
        parentLinkId: link.ParentLinkID,
        shareId,
        size: link.Size,
        order,
    };
    return processedLink;
};

export const getDefaultSessionValue = () => ({
    lastIndex: 0,
    sessionName: 'test',
    isDone: false,
    total: 200000,
});

/**
 * Transforms url hash into an object
 * @param urlHash Example: `#q=query&sort=acs`
 */
export const parseHashParams = (urlHash: string) => {
    const result: Record<string, string> = {};

    return urlHash
        .slice(1)
        .split('&')
        .reduce(function (res, item) {
            const [key, value] = item.split('=');
            res[key] = value;
            return res;
        }, result);
};

export const extractSearchParameters = (location: Location): string => {
    const hashParams = parseHashParams(location.hash);
    const { q } = hashParams;
    return q ? decodeURIComponent(q) : '';
};
