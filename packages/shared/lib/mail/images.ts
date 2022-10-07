import { SHOW_IMAGES } from '@proton/shared/lib/constants';
import { MailSettings } from '@proton/shared/lib/interfaces';

export const hasShowEmbedded = ({ HideEmbeddedImages = SHOW_IMAGES.SHOW }: Partial<MailSettings> = {}) =>
    HideEmbeddedImages === SHOW_IMAGES.SHOW;

export const hasShowRemote = ({ HideRemoteImages = SHOW_IMAGES.SHOW }: Partial<MailSettings> = {}) =>
    HideRemoteImages === SHOW_IMAGES.SHOW;
