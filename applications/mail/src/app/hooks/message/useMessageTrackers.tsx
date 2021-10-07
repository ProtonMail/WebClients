import { useMailSettings } from '@proton/components';
import { IMAGE_PROXY_FLAGS, SHOW_IMAGES } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { c, msgid } from 'ttag';
import { useEffect, useState } from 'react';
import { MessageExtended } from '../../models/message';

interface Props {
    message: MessageExtended;
    isDetails?: boolean;
}

export const useMessageTrackers = ({ message, isDetails = false }: Props) => {
    const [mailSettings] = useMailSettings();
    const [title, setTitle] = useState<string>('');

    const hasProtection = (mailSettings?.ImageProxy ? mailSettings.ImageProxy : 0) > IMAGE_PROXY_FLAGS.NONE;
    const hasShowImage = hasBit(mailSettings?.ShowImages ? mailSettings.ShowImages : 0, SHOW_IMAGES.REMOTE);
    const numberOfTrackers =
        message.messageImages?.images.filter((image) => {
            return image.tracker !== undefined;
        }).length || 0;

    /*
     * If email protection is OFF and we do not load the image automatically, the user is aware about the need of protection.
     * From our side, we want to inform him that he can also turn on protection mode in the settings.
     */
    const needsMoreProtection = !hasProtection && !hasShowImage;

    useEffect(() => {
        let title;

        if (needsMoreProtection) {
            title = c('Info').t`Protect yourself from trackers by turning on Proton email tracker protection.`;
        } else if (hasProtection && numberOfTrackers === 0) {
            title = c('Info').t`No email trackers found.`;
        } else if (isDetails) {
            title = c('Info').ngettext(
                msgid`${numberOfTrackers} email tracker found`,
                `${numberOfTrackers} email trackers found`,
                numberOfTrackers
            );
        } else {
            title = c('Info').t`Proton has blocked email trackers in this message in order to protect your privacy.`;
        }

        setTitle(title);
    }, [numberOfTrackers, needsMoreProtection, hasProtection, isDetails]);

    return { hasProtection, hasShowImage, numberOfTrackers, needsMoreProtection, title };
};
