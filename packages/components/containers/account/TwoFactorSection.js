import React from 'react';
import { c } from 'ttag';
import { Row, Label, Info, Field, Toggle, useConfig, useModals, useUserSettings } from 'react-components';
import { APPS } from 'proton-shared/lib/constants';

import EnableTwoFactorModal from './EnableTwoFactorModal';
import DisableTwoFactorModal from './DisableTwoFactorModal';

const TwoFactorSection = () => {
    const { APP_NAME } = useConfig();
    const [{ '2FA': { Enabled } } = {}] = useUserSettings();
    const { createModal } = useModals();

    const handleChange = () => {
        if (Enabled) {
            return createModal(<DisableTwoFactorModal />);
        }
        return createModal(<EnableTwoFactorModal />);
    };

    const twoFactorAuthLink =
        APP_NAME === APPS.PROTONVPN_SETTINGS
            ? 'https://protonvpn.com/support/two-factor-authentication'
            : 'https://protonmail.com/support/knowledge-base/two-factor-authentication';

    return (
        <Row>
            <Label htmlFor="twoFactorToggle">
                <span className="mr0-5">{c('Label').t`Two-factor authentication`}</span>
                <Info url={twoFactorAuthLink} />
            </Label>
            <Field>
                <Toggle checked={!!Enabled} id="twoFactorToggle" onChange={handleChange} />
            </Field>
        </Row>
    );
};

export default TwoFactorSection;
