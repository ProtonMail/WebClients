import { useState } from 'react';

import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import SkeletonLoader from '@proton/components/components/skeletonLoader/SkeletonLoader';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import type { TaxCountryHook, VatNumberHook } from '@proton/payments/ui';
import { getVatNumberName } from '@proton/payments/ui';
import { getAddVatNumberText, getVatPlaceholder } from '@proton/payments/ui/components/VatNumberInput';

type Props = VatNumberHook & {
    taxCountry: TaxCountryHook;
};

export const VatNumberInput = ({
    vatNumber,
    setVatNumber,
    enableVatNumber,
    renderVatNumberInput,
    taxCountry,
    loading,
}: Props) => {
    const [showVatInput, setShowVatInput] = useState(!!vatNumber);
    if (loading) {
        return <SkeletonLoader className="w-full my-4" height="5em" />;
    }

    if (renderVatNumberInput && enableVatNumber) {
        return showVatInput ? (
            <InputFieldTwo
                rootClassName="my-4"
                label={getVatNumberName(taxCountry.selectedCountryCode)}
                hint={c('info').t`Optional`}
                assistiveText={c('Payments').t`This number will be shown on all future invoices`}
                onValue={setVatNumber}
                value={vatNumber}
                placeholder={getVatPlaceholder(taxCountry.selectedCountryCode)}
                data-testid="vat-id-input"
            />
        ) : (
            <InlineLinkButton className="my-4 flex" onClick={() => setShowVatInput(true)}>
                {getAddVatNumberText(taxCountry.selectedCountryCode)}
            </InlineLinkButton>
        );
    }
    return null;
};
