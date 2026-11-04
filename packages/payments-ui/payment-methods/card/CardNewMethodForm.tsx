import type { ReactNode } from 'react';

import Alert3DS from '@proton/components/containers/payments/Alert3ds';

import type { ProcessorsResetOnIframeUnmount } from '../../ui/components/ChargebeeIframe';
import { type ChargebeeCardWrapperProps, ChargebeeCreditCardWrapper } from '../../ui/components/ChargebeeWrapper';

type Props = Pick<
    ChargebeeCardWrapperProps,
    'iframeHandles' | 'onInitialized' | 'themeCode' | 'showCountry' | 'creditCardDetailsRef'
> &
    ProcessorsResetOnIframeUnmount & {
        taxFields: ReactNode;
        showAlert3ds: boolean;
    };

export const CardNewMethodForm = ({ taxFields, showAlert3ds, ...cardWrapperProps }: Props) => (
    <>
        <ChargebeeCreditCardWrapper {...cardWrapperProps} suffix={taxFields} />
        {showAlert3ds && <Alert3DS />}
    </>
);
