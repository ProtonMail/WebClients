import { c } from 'ttag';

import { Option, SelectTwo } from '@proton/components/components';
import { SettingsLayout, SettingsLayoutLeft, SettingsLayoutRight } from '@proton/components/containers/account';

export const InvoiceExpirySetting = () => {
    return (
        <SettingsLayout className="flex flex-row flex-align-items-center">
            <SettingsLayoutLeft>
                <label className="text-semibold" htmlFor="invoice-expiry" id="label-invoice-expiry">
                    <span className="mr-2">{c('Wallet Settings').t`Invoice expiry`}</span>
                </label>
            </SettingsLayoutLeft>

            {/* TODO: Connect this selector to API */}
            <SettingsLayoutRight className="pt-2 flex flex-align-items-center">
                <SelectTwo id="invoice-expiry" aria-describedby="label-invoice-expiry">
                    <Option value="3" title="3 days" />
                    <Option value="6" title="6 days" />
                    <Option value="9" title="9 days" />
                    <Option value="12" title="12 days" />
                    <Option value="15" title="15 days" />
                </SelectTwo>
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};
