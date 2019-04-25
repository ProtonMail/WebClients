import React from 'react';
import { c } from 'ttag';
import { updatePromptPin } from 'proton-shared/lib/api/mailSettings';
import {
    Alert,
    SubTitle,
    Row,
    Field,
    Label,
    Info,
    Toggle,
    useApiWithoutResult,
    useToggle,
    useEventManager
} from 'react-components';
import { useMailSettings } from '../../models/mailSettingsModel';

const AddressVerificationSection = () => {
    const { call } = useEventManager();
    const [mailSettings] = useMailSettings();
    const { state, toggle } = useToggle(!!mailSettings.PromptPin);
    const { request, loading } = useApiWithoutResult(updatePromptPin);

    const handleChange = async ({ target }) => {
        const newValue = target.checked;
        await request(+newValue);
        call();
        toggle();
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
                <Field>
                    <Toggle id="trustToggle" loading={loading} checked={state} onChange={handleChange} />
                </Field>
            </Row>
        </>
    );
};

export default AddressVerificationSection;
