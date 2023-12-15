import { DefaultInvoiceAmountSetting } from './DefaultInvoiceAmountSetting';
import { DefaultInvoiceDescriptionSetting } from './DefaultInvoiceDescriptionSetting';
import { InvoiceExpirySetting } from './InvoiceExpirySetting';

export const InvoicesSettingsSubSection = () => {
    return (
        <>
            <DefaultInvoiceDescriptionSetting />
            <DefaultInvoiceAmountSetting />
            <InvoiceExpirySetting />
        </>
    );
};
