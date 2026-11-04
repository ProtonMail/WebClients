import type { ReactNode } from 'react';

import type { ProcessorsResetOnIframeUnmount } from '../../ui/components/ChargebeeIframe';
import { type DirectDebitProps, SepaDirectDebit } from '../../ui/components/SepaDirectDebit';

type Props = Pick<DirectDebitProps, 'iframeHandles' | 'onInitialized'> &
    ProcessorsResetOnIframeUnmount & {
        taxFields: ReactNode;
    };

export const SepaNewMethodForm = ({ taxFields, ...directDebitProps }: Props) => (
    <>
        <SepaDirectDebit {...directDebitProps} />
        <div className="mt-2">{taxFields}</div>
    </>
);
