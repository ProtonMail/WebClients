import type { Ref } from 'react';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';

import useApi from '@proton/components/hooks/useApi';
import type { Invoice, Transaction } from '@proton/payments';
import { isTransaction, getInvoicePDF, getTransactionPDF } from '@proton/payments';

import FilePreview from '../filePreview/FilePreview';
import NavigationControl from '../filePreview/NavigationControl';
import { getInvoicePaymentsVersion } from './helpers';

export interface PdfPreviewControls {
    preview: (item: Invoice | Transaction) => void;
}

interface Preview {
    item: Invoice | Transaction;
    contents?: Uint8Array<ArrayBuffer>[];
}

type Props =
    | {
          type: 'invoice';
          items: Invoice[];
          onDownload: (item: Invoice) => void;
          getFilename: (item: Invoice) => string;
      }
    | {
          type: 'transaction';
          items: Transaction[];
          onDownload: (item: Transaction) => void;
          getFilename: (item: Transaction) => string;
      };

const PaymentsPdfPreviewBase = ({ items, onDownload, getFilename }: Props, ref: Ref<PdfPreviewControls>) => {
    const api = useApi();
    const [previewing, setPreviewing] = useState<Preview>();
    const rootRef = useRef<HTMLDivElement>(null);

    const handlePreview = async (item: Invoice | Transaction) => {
        setPreviewing({ item });

        const getPDF = () => {
            if (isTransaction(item)) {
                return getTransactionPDF(item.TransactionID);
            }

            return getInvoicePDF(item.ID, getInvoicePaymentsVersion(item));
        };

        const buffer = await api<Uint8Array<ArrayBuffer>>(getPDF());
        setPreviewing((previewing) => {
            if (previewing === undefined || previewing.item !== item) {
                return previewing;
            }

            return {
                ...previewing,
                contents: [buffer],
            };
        });
    };

    useImperativeHandle(ref, () => ({
        preview: handlePreview,
    }));

    if (!previewing) {
        return null;
    }

    const current = items.findIndex((item) => item === previewing.item) + 1;
    const total = items.length;

    const handleNext = () => handlePreview(items[current]);
    const handlePrevious = () => handlePreview(items[current - 2]);
    const handleClose = () => setPreviewing(undefined);

    const handleDownload = () => {
        if (!previewing.item) {
            return;
        }
        onDownload(previewing.item as any);
    };

    const filename = () => {
        if (!previewing.item) {
            return;
        }
        return getFilename(previewing.item as any);
    };

    return (
        <FilePreview
            isLoading={!previewing.contents}
            contents={previewing.contents}
            fileName={filename()}
            fileSize={previewing.contents?.length}
            mimeType="application/pdf"
            onClose={handleClose}
            onDownload={handleDownload}
            ref={rootRef}
            navigationControls={
                <NavigationControl
                    current={current}
                    total={total}
                    rootRef={rootRef}
                    onNext={handleNext}
                    onPrev={handlePrevious}
                />
            }
        />
    );
};

const PaymentsPdfPreview = forwardRef(PaymentsPdfPreviewBase);

export default PaymentsPdfPreview;
