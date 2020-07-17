import { MailSettings } from 'proton-shared/lib/interfaces';
import { SHOW_IMAGES } from 'proton-shared/lib/constants';
import { hasBit } from 'proton-shared/lib/helpers/bitset';

export const hasShowEmbedded = ({ ShowImages = 0 }: Partial<MailSettings> = {}) =>
    hasBit(ShowImages, SHOW_IMAGES.EMBEDDED);

export const hasShowRemote = ({ ShowImages = 0 }: Partial<MailSettings> = {}) => hasBit(ShowImages, SHOW_IMAGES.REMOTE);
