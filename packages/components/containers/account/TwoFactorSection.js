import React from 'react';
import { c } from 'ttag';
import { SubTitle, Row, Label, Info, Field, Toggle, useConfig, useModals, useUserSettings } from 'react-components';
import { CLIENT_TYPES } from 'proton-shared/lib/constants';

import EnableTwoFactorModal from './EnableTwoFactorModal';
import DisableTwoFactorModal from './DisableTwoFactorModal';

const TwoFactorSection = () => {
    const { CLIENT_TYPE } = useConfig();
    const [{ '2FA': { Enabled } } = {}] = useUserSettings();
    const { createModal } = useModals();

    const handleChange = () => {
        if (Enabled) {
            return createModal(<DisableTwoFactorModal />);
        }
        return createModal(<EnableTwoFactorModal />);
    };

    const { VPN } = CLIENT_TYPES;
    const twoFactorAuthLink =
        CLIENT_TYPE === VPN
            ? 'https://protonvpn.com/support/two-factor-authentication'
            : 'https://protonmail.com/support/knowledge-base/two-factor-authentication';

    return (
        <>
            <SubTitle>{c('Title').t`Two-factor authentication`}</SubTitle>
            <Row>
                <Label htmlFor="twoFactorToggle">
                    <span className="mr0-5">{c('Label').t`Two-factor authentication`}</span>
                    <Info url={twoFactorAuthLink} />
                </Label>
                <Field>
                    <Toggle checked={!!Enabled} id="twoFactorToggle" onChange={handleChange} />
                </Field>
            </Row>
        </>
    );
};

export default TwoFactorSection;
