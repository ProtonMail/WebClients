import { useImperativeHandle, forwardRef, Ref, useState, useRef } from 'react';

import { getInvoice } from '@proton/shared/lib/api/payments';

import { useApi } from '../../hooks';
import { FilePreview, NavigationControl } from '../filePreview';
import { Invoice } from './interface';

interface InvoicesPreviewControls {
    preview: (invoice: Invoice) => void;
}

interface Preview {
    invoice: Invoice;
    contents?: Uint8Array[];
}

interface Props {
    invoices: Invoice[];
    onDownload: (invoice: Invoice) => void;
    getFilename: (invoice: Invoice) => string;
}

const InvoicesPreview = (
    { invoices, onDownload, getFilename }: Props,
    ref: Ref<InvoicesPreviewControls | undefined>
) => {
    const api = useApi();
    const [previewing, setPreviewing] = useState<Preview>();

    const rootRef = useRef<HTMLDivElement>(null);

    const handlePreview = async (invoice: Invoice) => {
        setPreviewing({ invoice });
        const buffer = await api<Uint8Array>(getInvoice(invoice.ID));
        setPreviewing((previewing) => {
            // Preview can be closed or changed during download;
            if (previewing === undefined || previewing.invoice !== invoice) {
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

    const current = invoices.findIndex((invoice) => invoice === previewing.invoice) + 1;
    const total = invoices.length;

    const handleNext = () => handlePreview(invoices[current]);
    const handlePrevious = () => handlePreview(invoices[current - 2]);
    const handleClose = () => setPreviewing(undefined);

    const handleDownload = () => {
        if (!previewing.invoice) {
            return;
        }
        onDownload(previewing.invoice);
    };

    const filename = () => {
        if (!previewing.invoice) {
            return;
        }
        return getFilename(previewing.invoice);
    };

    return (
        <FilePreview
            loading={!previewing.contents}
            contents={previewing.contents}
            fileName={filename()}
            fileSize={previewing.contents?.length}
            mimeType="application/pdf"
            onClose={handleClose}
            onSave={handleDownload}
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

export default forwardRef(InvoicesPreview);
