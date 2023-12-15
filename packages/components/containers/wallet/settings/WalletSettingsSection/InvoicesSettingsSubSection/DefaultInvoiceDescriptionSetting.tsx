import { c } from 'ttag';

import { InputFieldTwo, TextAreaTwo } from '@proton/components/components';
import { SettingsLayout, SettingsLayoutLeft, SettingsLayoutRight } from '@proton/components/containers/account';

export const DefaultInvoiceDescriptionSetting = () => {
    return (
        <SettingsLayout className="flex flex-row flex-align-items-top">
            <SettingsLayoutLeft>
                <label className="text-semibold block mt-2" htmlFor="default-invoice=description">
                    <span className="mr-2 mt-4">{c('Wallet Settings').t`Default invoice description`}</span>
                </label>
            </SettingsLayoutLeft>
            {/* TODO: Connect this selector to API */}
            <SettingsLayoutRight className="pt-2 flex flex-align-items-center">
                <InputFieldTwo as={TextAreaTwo} id="default-invoice=description" />
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};
