import React, { useState, useEffect } from 'react';
import { c } from 'ttag';
import { updatePromptPin } from 'proton-shared/lib/api/mailSettings';
import { Alert, SubTitle, Row, Label, Info, Toggle, useApiWithoutResult } from 'react-components';
import { useMailSettings } from '../../models/mailSettingsModel';

const AddressVerificationSection = () => {
    const [mailSettings] = useMailSettings();
    const [promptPin, setPromptPin] = useState(!!mailSettings.PromptPin);
    const { request } = useApiWithoutResult(updatePromptPin);

    // Handle updates from the Event Manager.
    useEffect(() => {
        setPromptPin(mailSettings.PromptPin);
    }, [mailSettings.PromptPin]);

    const handleChange = async (newValue) => {
        await request(+newValue);
        setPromptPin(newValue);
    };

    return (
        <>
            <SubTitle>{c('Title').t`Address verification`}</SubTitle>
            <Alert learnMore="https://protonmail.com/support/knowledge-base/address-verification/">
                {c('Info')
                    .t`Address verification is an advanced security feature. Only turn this on if you know what it does.`}
            </Alert>
            <Row>
                <Label htmlFor="trustToggle">
                    <span className="mr1">{c('Label').t`Prompt to trust keys`}</span>
                    <Info
                        url="https://protonmail.com/support/knowledge-base/address-verification/"
                        title={c('Tooltip prompt to trust keys')
                            .t`When receiving an internal message from a sender that has no trusted keys in your contacts, show a banner asking if you want to enable trusted keys.`}
                    />
                </Label>
                <Toggle id="trustToggle" value={promptPin} onChange={handleChange} />
            </Row>
        </>
    );
};

export default AddressVerificationSection;
