import { useEffect, useState } from 'react';

import { c } from 'ttag';

interface PDFPreviewProps {
    filename?: string;
    contents: Uint8Array<ArrayBuffer>[];
}

const PDFPreview = ({ filename = 'preview.pdf', contents }: PDFPreviewProps) => {
    const [url, setUrl] = useState<string>();

    useEffect(() => {
        const file = new File(contents, filename, { type: 'application/pdf' });
        const newUrl = URL.createObjectURL(file);
        setUrl(newUrl);
        return () => {
            if (newUrl) {
                URL.revokeObjectURL(newUrl);
            }
        };
    }, [contents, filename]);

    return (
        <>
            {url && (
                <object
                    data={url}
                    className="w-full flex *:min-size-auto flex-auto flex-column-reverse"
                    type="application/pdf"
                    title={filename}
                >
                    <embed src={url} className="flex" type="application/pdf" />
                    <p className="m-auto">{c('Info')
                        .t`This browser does not support previewing PDF documents. Please download the file.`}</p>
                </object>
            )}
        </>
    );
};

export default PDFPreview;
