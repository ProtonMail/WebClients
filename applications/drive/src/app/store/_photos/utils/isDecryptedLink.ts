import type { DecryptedLink } from '../../_links';
import type { PhotoLink } from '../interface';

export const isDecryptedLink = (link: PhotoLink | undefined): link is DecryptedLink =>
    !!link && 'encryptedName' in link;
