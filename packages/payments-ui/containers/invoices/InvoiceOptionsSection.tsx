import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';

import { type InvoiceOptionKey, useInvoiceOptions } from './useInvoiceOptions';

const getLabels = (): Record<InvoiceOptionKey, string> => ({
    editBillingAddress: c('Label').t`Billing address`,
    editInvoiceNote: c('Label').t`Invoice note`,
    setInvoiceEmail: c('Label').t`Invoice email`,
});

/**
 * The actions of the invoices section's "Invoice options" dropdown, as a section of their own.
 */
const InvoiceOptionsSection = () => {
    const { options, modals } = useInvoiceOptions({ showInvoiceNote: true });
    const labels = getLabels();

    return (
        <>
            <SettingsSectionWide>
                <SettingsParagraph>
                    {c('Info').t`Set the billing address, note and email address used for your invoices.`}
                </SettingsParagraph>
                {options.map(({ key, text, onClick, loading, isSelected }) => (
                    <SettingsLayout key={key}>
                        <SettingsLayoutLeft>
                            <span className="text-semibold">{labels[key]}</span>
                        </SettingsLayoutLeft>
                        <SettingsLayoutRight className="flex items-center gap-2">
                            <Button shape="outline" onClick={onClick} loading={loading} data-testid={key}>
                                {text}
                            </Button>
                            {isSelected && (
                                <IcCheckmark className="shrink-0 color-primary" data-testid={`${key}Selected`} />
                            )}
                        </SettingsLayoutRight>
                    </SettingsLayout>
                ))}
            </SettingsSectionWide>
            {modals}
        </>
    );
};

export default InvoiceOptionsSection;
