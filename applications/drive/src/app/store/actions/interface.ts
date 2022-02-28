import { LinkType } from '../links';

export type LinkInfo = {
    parentLinkId: string;
    linkId: string;
    name: string;
    type: LinkType;
};
