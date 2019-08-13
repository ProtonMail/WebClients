import React from 'react';
import { c } from 'ttag';
import { SubTitle, Row, Label, Info, Field, Toggle, useModals, useUserSettings } from 'react-components';

import EnableTwoFactorModal from './EnableTwoFactorModal';
import DisableTwoFactorModal from './DisableTwoFactorModal';

const TwoFactorSection = () => {
    const [{ '2FA': { Enabled } } = {}] = useUserSettings();
    const { createModal } = useModals();

    const handleChange = () => {
        if (Enabled) {
            return createModal(<DisableTwoFactorModal />);
        }
        return createModal(<EnableTwoFactorModal />);
    };

    return (
        <>
            <SubTitle>{c('Title').t`Two-factor authentication`}</SubTitle>
            <Row>
                <Label htmlFor="twoFactorToggle">
                    <span className="mr0-5">{c('Label').t`Two-factor authentication`}</span>
                    <Info url="https://protonmail.com/support/knowledge-base/two-factor-authentication/" />
                </Label>
                <Field>
                    <Toggle checked={!!Enabled} id="twoFactorToggle" onChange={handleChange} />
                </Field>
            </Row>
        </>
    );
};

export default TwoFactorSection;
