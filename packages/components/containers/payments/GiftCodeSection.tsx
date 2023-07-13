import { ChangeEvent, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useLoading } from '@proton/hooks';
import { buyCredit, validateCredit } from '@proton/shared/lib/api/payments';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import { InputFieldTwo, useFormErrors } from '../../components';
import { useApiWithoutResult, useEventManager, useNotifications } from '../../hooks';
import { SettingsSection } from '../account';
import SettingsParagraph from '../account/SettingsParagraph';

const GiftCodeSection = () => {
    const [value, setValue] = useState('');
    const { validator, reset, onFormSubmit } = useFormErrors();
    const [loading, withLoading] = useLoading();
    const { request: requestBuyCredit } = useApiWithoutResult(buyCredit);
    const { request: requestValidateCredit } = useApiWithoutResult(validateCredit);
    const { call } = useEventManager();
    const { createNotification } = useNotifications();

    const handleChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
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
                className="gift-code_container flex flex-nowrap flex-align-items-start on-mobile-flex-column-no-stretch"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (onFormSubmit()) {
                        withLoading(submit());
                    }
                }}
            >
                <InputFieldTwo
                    id="gift-code-input"
                    rootClassName="mr-0 mb-2 md:mr-4 md:mb-0"
                    value={value}
                    error={validator([requiredValidator(value)])}
                    placeholder={c('Placeholder').t`Add gift code`}
                    onChange={handleChange}
                />
                <Button
                    className="on-mobile-flex-align-self-start flex-item-noshrink"
                    color="norm"
                    type="submit"
                    data-testid="submitCodeBtn"
                    loading={loading}
                >
                    {c('Action').t`Submit`}
                </Button>
            </form>
        </SettingsSection>
    );
};

export default GiftCodeSection;
