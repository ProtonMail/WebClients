import type { ChangeEvent } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import { useLoading } from '@proton/hooks';
import { buyCredit, validateCredit } from '@proton/payments/core/api/api';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import InputFieldTwo from '../../components/v2/field/InputField';
import useFormErrors from '../../components/v2/useFormErrors';
import useApi from '../../hooks/useApi';
import useEventManager from '../../hooks/useEventManager';
import SettingsParagraph from '../account/SettingsParagraph';
import SettingsSection from '../account/SettingsSection';

const GiftCodeSection = () => {
    const [value, setValue] = useState('');
    const { validator, reset, onFormSubmit } = useFormErrors();
    const [loading, withLoading] = useLoading();
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();

    const handleChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
        setValue(target.value.replace(/\s|\t/g, '').toUpperCase());
    };

    const submit = async () => {
        await api(validateCredit({ GiftCode: value }));
        await api(buyCredit({ GiftCode: value, Amount: 0 }));
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
                className="gift-code_container flex flex-nowrap flex-column md:flex-row gap-2 md:gap-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (onFormSubmit()) {
                        void withLoading(submit());
                    }
                }}
            >
                <InputFieldTwo
                    id="gift-code-input"
                    value={value}
                    error={validator([requiredValidator(value)])}
                    placeholder={c('Placeholder').t`Add gift code`}
                    onChange={handleChange}
                />
                <div className="shrink-0">
                    <Button color="norm" type="submit" data-testid="submitCodeBtn" loading={loading}>
                        {c('Action').t`Submit`}
                    </Button>
                </div>
            </form>
        </SettingsSection>
    );
};

export default GiftCodeSection;
