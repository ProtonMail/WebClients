import { useMailSettings } from '@proton/components';
import { IMAGE_PROXY_FLAGS, SHOW_IMAGES } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { c } from 'ttag';
import { MessageExtended } from '../../models/message';

interface Props {
    message: MessageExtended;
}

export const useMessageTrackers = ({ message }: Props) => {
    const [mailSettings] = useMailSettings();

    const getNumberOfTrackers = () => {
        return (
            message.messageImages?.images.filter((image) => {
                return image.tracker !== undefined;
            }).length || 0
        );
    };

    const hasProtection = (mailSettings?.ImageProxy ? mailSettings.ImageProxy : 0) > IMAGE_PROXY_FLAGS.NONE;
    const hasShowImage = hasBit(mailSettings?.ShowImages ? mailSettings.ShowImages : 0, SHOW_IMAGES.REMOTE);
    const numberOfTrackers = getNumberOfTrackers();

    /*
     * If email protection is OFF and we do not load the image automatically, the user is aware about the need of protection.
     * From our side, we want to inform him that he can also turn on protection mode in the settings.
     */
    const needsMoreProtection = !hasProtection && !hasShowImage;

    const getTitle = () => {
        if (needsMoreProtection) {
            return c('Info').t`Protect yourself from trackers by turning on Proton email tracker protection.`;
        }
        if (hasProtection && numberOfTrackers === 0) {
            return c('Info').t`No email trackers found.`;
        }

        return c('Info').t`Proton has blocked email trackers in this message in order to protect your privacy.`;
    };

    return { hasProtection, hasShowImage, numberOfTrackers, needsMoreProtection, getTitle };
};
