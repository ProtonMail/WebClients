import React, { useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { updateSign, updateAttachPublicKey, updatePGPScheme } from 'proton-shared/lib/api/mailSettings';
import {
    Alert,
    SubTitle,
    Row,
    Label,
    LearnMore,
    Info,
    Toggle,
    Select,
    ConfirmModal,
    useApiWithoutResult,
    useModal
} from 'react-components';
import { PACKAGE_TYPE } from 'proton-shared/lib/constants';

const ExternalPGPSettingsSection = ({ mailSettings }) => {
    const [sign, setSign] = useState(!!mailSettings.Sign);
    const { isOpen, open, close } = useModal();
    const [attachPublicKey, setAttachPublicKey] = useState(!!mailSettings.AttachPublicKey);
    const [PGPScheme, setPGPSheme] = useState(mailSettings.PGPScheme);
    const options = [
        { value: PACKAGE_TYPE.SEND_PGP_MIME, text: 'PGP/MIME' },
        { value: PACKAGE_TYPE.SEND_PGP_INLINE, text: 'Inline PGP' }
    ];

    const { request: requestSign } = useApiWithoutResult(updateSign);
    const { request: requestAttachPublicKey } = useApiWithoutResult(updateAttachPublicKey);
    const { request: requestPGPScheme } = useApiWithoutResult(updatePGPScheme);
    const handleConfirmSign = () => handleChangeSign(true);

    const handleChangeSign = async (newValue) => {
        await requestSign(+newValue);
        setSign(newValue);
    };

    const handleChangeAttachPublicKey = async (newValue) => {
        askSign(newValue);
        await requestAttachPublicKey(+newValue);
        setAttachPublicKey(newValue);
    };

    const handleChangePGPScheme = async ({ target }) => {
        const newValue = parseInt(target.value);
        await requestPGPScheme(newValue);
        setPGPSheme(newValue);
    };

    const askSign = (status) => {
        if (!status || sign) {
            return false;
        }
        open();
    };

    return (
        <>
            <SubTitle>{c('Title').t`External PGP settings (optional)`}</SubTitle>
            <Alert>
                {c('Info').t`Only change these settings if you are using PGP with non-ProtonMail recipients.`}
                <br />
                <LearnMore url="https://protonmail.com/support/knowledge-base/how-to-use-pgp/" />
            </Alert>
            <Row>
                <Label htmlFor="signToggle">
                    {c('Label').t`Sign external messages`}
                    <Info
                        url="https://protonmail.com/support/knowledge-base/what-is-a-digital-signature/"
                        title={c('Tooltip sign external messages')
                            .t`Automatically sign all your outgoing messages so users can verify the authenticity of your messages. This is done in combination with the Default PGP Scheme that is selected down below.`}
                    />
                </Label>
                <Toggle id="signToggle" value={sign} onChange={handleChangeSign} />
            </Row>
            <Row>
                <Label htmlFor="attachPublicKeyToggle">
                    {c('Label').t`Automatically attach public key`}
                    <Info
                        url="https://protonmail.com/support/knowledge-base/how-to-use-pgp"
                        title={c('Tooltip automatically attach public key')
                            .t`This automatically adds your public key to each message you send. Recipients can use this to verify the authenticity of your messages and send encrypted messages to you.`}
                    />
                </Label>
                <Toggle id="attachPublicKeyToggle" value={attachPublicKey} onChange={handleChangeAttachPublicKey} />
            </Row>
            <ConfirmModal
                show={isOpen}
                onClose={close}
                confirm={c('Action').t`Yes`}
                cancel={c('Action').t`No`}
                title={c('Title').t`Automatic sign outgoing messages?`}
                onConfirm={handleConfirmSign}
            >
                <Alert>{c('Info')
                    .t`PGP clients are more likely to automatically detect your PGP keys if outgoing messages are signed.`}</Alert>
            </ConfirmModal>
            <Row>
                <Label htmlFor="PGPSchemeSelect">
                    {c('Label').t`Default PGP Scheme`}
                    <Info
                        url="https://protonmail.com/support/knowledge-base/pgp-mime-pgp-inline/"
                        title={c('Tooltip default pgp scheme')
                            .t`Select the default PGP scheme to be used when signing or encrypting to an user. Note that PGP/Inline forces plain text messages. Click for more info.`}
                    />
                </Label>
                <Select id="PGPSchemeSelect" value={PGPScheme} options={options} onChange={handleChangePGPScheme} />
            </Row>
        </>
    );
};

ExternalPGPSettingsSection.propTypes = {
    mailSettings: PropTypes.object.isRequired
};

const mapStateToProps = ({ mailSettings: { data } }) => ({ mailSettings: data });

export default connect(mapStateToProps)(ExternalPGPSettingsSection);
