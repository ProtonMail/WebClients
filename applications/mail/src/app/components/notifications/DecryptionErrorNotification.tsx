import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { SettingsLink } from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';

import { reActivateKeySettingsURL, restoringEncryptedMessagesURL } from '../../constants';

interface Props {
    keyFound?: boolean;
}

const DecryptionErrorNotification = ({ keyFound = false }: Props) => {
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

        if (keyFound) {
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

        return c('Error').jt`Your emails cannot be decrypted. This may be due to a password reset. ${learnMoreLink}`;
    };

    return <span>{getNotificationText()}</span>;
};

export default DecryptionErrorNotification;
