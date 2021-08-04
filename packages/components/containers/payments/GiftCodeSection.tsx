import { useState } from 'react';
import * as React from 'react';
import { c } from 'ttag';
import { validateCredit, buyCredit } from '@proton/shared/lib/api/payments';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import { useLoading, useEventManager, useNotifications, useApiWithoutResult } from '../../hooks';

import { Button, InputFieldTwo, useFormErrors } from '../../components';
import SettingsParagraph from '../account/SettingsParagraph';
import { SettingsSection } from '../account';

import './GiftCodeSection.scss';

const GiftCodeSection = () => {
    const [value, setValue] = useState('');
    const { validator, reset, onFormSubmit } = useFormErrors();
    const [loading, withLoading] = useLoading();
    const { request: requestBuyCredit } = useApiWithoutResult(buyCredit);
    const { request: requestValidateCredit } = useApiWithoutResult(validateCredit);
    const { call } = useEventManager();
    const { createNotification } = useNotifications();

    const handleChange = ({ target }: React.ChangeEvent<HTMLInputElement>) => {
        setValue(target.value.replace(/\s|\t/g, '').toUpperCase());
    };

    const submit = async () => {
        await requestValidateCredit({ GiftCode: value });
        await requestBuyCredit({ GiftCode: value, Amount: 0 });
        await call();
        setValue('');
        reset();
        createNotification({ text: c('Success').t`Gift code applied` });
    };

    return (
        <SettingsSection>
            <SettingsParagraph>
                {c('Info').t`If you have a gift code, enter it below to apply your discount.`}
            </SettingsParagraph>

            <label htmlFor="gift-code-input" className="sr-only">
                {c('Label').t`Gift code`}
            </label>

            <form
                className="gift-code_container"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (onFormSubmit()) {
                        withLoading(submit());
                    }
                }}
            >
                <InputFieldTwo
                    id="gift-code-input"
                    rootClassName="gift-code_input"
                    value={value}
                    error={validator([requiredValidator(value)])}
                    placeholder={c('Placeholder').t`Add gift code`}
                    onChange={handleChange}
                />
                <Button color="norm" type="submit" loading={loading}>
                    {c('Action').t`Submit`}
                </Button>
            </form>
        </SettingsSection>
    );
};

export default GiftCodeSection;
