import { MailSettings } from '@proton/shared/lib/interfaces';
import { SHOW_IMAGES } from '@proton/shared/lib/mail/mailSettings';

export const hasShowEmbedded = ({ HideEmbeddedImages }: Partial<MailSettings> = {}) =>
    HideEmbeddedImages === SHOW_IMAGES.SHOW;

export const hasShowRemote = ({ HideRemoteImages }: Partial<MailSettings> = {}) =>
    HideRemoteImages === SHOW_IMAGES.SHOW;
