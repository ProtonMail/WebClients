import { c } from 'ttag';

import { InputFieldTwo } from '@proton/components/components';
import { SettingsLayout, SettingsLayoutLeft, SettingsLayoutRight } from '@proton/components/containers/account';

export const DefaultInvoiceAmountSetting = () => {
    return (
        <SettingsLayout className="flex flex-row flex-align-items-top">
            <SettingsLayoutLeft>
                <label className="text-semibold block mt-2" htmlFor="default-invoice-unit">
                    <span className="mr-2">{c('Wallet Settings').t`Default invoice amount`}</span>
                </label>
            </SettingsLayoutLeft>
            {/* TODO: Connect this selector to API */}
            <SettingsLayoutRight className="pt-2 flex flex-align-items-center">
                <InputFieldTwo type="number" min={0} id="default-invoice-unit" />
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};
