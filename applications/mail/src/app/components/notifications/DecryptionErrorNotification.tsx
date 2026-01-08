import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { SettingsLink } from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';

import { manageAddressKeysSettingsURL, reActivateKeySettingsURL, restoringEncryptedMessagesURL } from '../../constants';

interface Props {
    /** `null` if key was not found */
    decryptionKeyInfo: { isKeyInactive: boolean } | null;
    /** whether the message has external origin and is end-to-end encrypted */
    isExternalMessageWithE2EE: boolean;
}

const DecryptionErrorNotification = ({ decryptionKeyInfo, isExternalMessageWithE2EE }: Props) => {
    const getNotificationText = () => {
        const learnMoreLink = (
            <Href
                key="learn-more-link"
                href={restoringEncryptedMessagesURL}
                className="text-bold link align-baseline color-inherit"
            >
                {c('Action').t`Learn more`}
            </Href>
        );

        if (decryptionKeyInfo !== null) {
            if (decryptionKeyInfo.isKeyInactive) {
                const reActivateKeyLink = (
                    <SettingsLink
                        key="re-activate-link"
                        path={reActivateKeySettingsURL}
                        className="text-bold link align-baseline color-inherit"
                        app={APPS.PROTONMAIL}
                    >
                        {
                            // translator: Link to settings, which is part of the string "If you remember your previous password, you can re-activate the previous key in order to access your messages."
                            c('Error').t`re-activate the previous key`
                        }
                    </SettingsLink>
                );

                // translator: The first variable contains a link to settings displayed as 're-activate the previous key' and the second variable contains a link to the support displayed as 'Learn more'
                return c('Error')
                    .jt`Your emails cannot be decrypted due to a recent password reset. If you remember your previous password, you can ${reActivateKeyLink} in order to access your messages. ${learnMoreLink}`;
            }

            // key is present and active but decryption still fails
            return c('Error')
                .jt`There was a problem decrypting your message. If the issue persists, contact our customer support.`;
        }

        // if the key cannot be found, either the user has deleted the address key, or the wrong public key was used for encryption.
        // the latter case can happen in two cases:
        // - with internal sender, in case of a Proton client bug, e.g. due to selecting a key from a different address of
        //      the same user (the BE should now guard against this error, but past messages with this issue are still present)
        // - with external sender, if the message was encrypted to the wrong key, or one that the recipient has not imported into their account
        const reimportKeyLink = (
            <SettingsLink
                key="import-address-key-link"
                path={manageAddressKeysSettingsURL}
                className="text-bold link align-baseline color-inherit"
                app={APPS.PROTONMAIL}
            >
                {
                    // translator: Link to settings, which is part of the string "If you deleted any of your address keys, try re-importing them"
                    c('Error').t`re-importing`
                }
            </SettingsLink>
        );

        if (isExternalMessageWithE2EE) {
            // translator: The first variable contains a link to settings displayed as 're-importing' and the second variable contains a link to the support displayed as 'Learn more'
            return c('Error')
                .jt`Your message cannot be decrypted. The key used to encrypt this message does not match any of the keys associated with your address. If you deleted any of your address keys, try ${reimportKeyLink} them. ${learnMoreLink}`;
        }

        // translator: The first variable contains a link to settings displayed as 're-importing' and the second variable contains a link to the support displayed as 'Learn more'
        return c('Error')
            .jt`Your message cannot be decrypted. If you deleted any of your address keys, try ${reimportKeyLink} them. ${learnMoreLink}`;
    };

    return <span>{getNotificationText()}</span>;
};

export default DecryptionErrorNotification;
