import React from 'react';
import { c } from 'ttag';
import { Alert, SubTitle, Row, Field, Label, Info, useMailSettings } from 'react-components';

import AttachPublicKeyToggle from './AttachPublicKeyToggle';
import SignToggle from './SignToggle';
import PGPSchemeSelect from './PGPSchemeSelect';

const ExternalPGPSettingsSection = () => {
    const [mailSettings] = useMailSettings();

    return (
        <>
            <SubTitle>{c('Title').t`External PGP settings (optional)`}</SubTitle>
            <Alert learnMore="https://protonmail.com/support/knowledge-base/how-to-use-pgp/">
                {c('Info').t`Only change these settings if you are using PGP with non-ProtonMail recipients.`}
            </Alert>
            <Row>
                <Label htmlFor="signToggle">
                    <span className="mr0-5">{c('Label').t`Sign external messages`}</span>
                    <Info
                        url="https://protonmail.com/support/knowledge-base/what-is-a-digital-signature/"
                        title={c('Tooltip sign external messages')
                            .t`Automatically sign all your outgoing messages so users can verify the authenticity of your messages. This is done in combination with the Default PGP Scheme that is selected down below.`}
                    />
                </Label>
                <Field>
                    <SignToggle id="signToggle" sign={mailSettings.Sign} />
                </Field>
            </Row>
            <Row>
                <Label htmlFor="attachPublicKeyToggle">
                    <span className="mr0-5">{c('Label').t`Automatically attach public key`}</span>
                    <Info
                        url="https://protonmail.com/support/knowledge-base/how-to-use-pgp"
                        title={c('Tooltip automatically attach public key')
                            .t`This automatically adds your public key to each message you send. Recipients can use this to verify the authenticity of your messages and send encrypted messages to you.`}
                    />
                </Label>
                <Field>
                    <AttachPublicKeyToggle
                        id="attachPublicKeyToggle"
                        attachPublicKey={mailSettings.AttachPublicKey}
                        sign={mailSettings.Sign}
                    />
                </Field>
            </Row>
            <Row>
                <Label htmlFor="PGPSchemeSelect">
                    <span className="mr0-5">{c('Label').t`Default PGP Scheme`}</span>
                    <Info
                        url="https://protonmail.com/support/knowledge-base/pgp-mime-pgp-inline/"
                        title={c('Tooltip default pgp scheme')
                            .t`Select the default PGP scheme to be used when signing or encrypting to an user. Note that PGP/Inline forces plain text messages. Click for more info.`}
                    />
                </Label>
                <Field>
                    <PGPSchemeSelect id="PGPSchemeSelect" pgpScheme={mailSettings.PGPScheme} />
                </Field>
            </Row>
        </>
    );
};

export default ExternalPGPSettingsSection;
