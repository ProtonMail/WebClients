import { DecryptedLink } from '../../_links';
import { PhotoLink } from '../interface';

export const isDecryptedLink = (link: PhotoLink | undefined): link is DecryptedLink =>
    !!link && 'encryptedName' in link;
