import { useEffect, useState } from 'react';

import { c } from 'ttag';

interface Props {
    filename?: string;
    contents?: Uint8Array[];
}
const PDFPreview = ({ filename = 'preview.pdf', contents }: Props) => {
    const [url, setUrl] = useState<string>();

    useEffect(() => {
        const newUrl = URL.createObjectURL(new Blob(contents, { type: 'application/pdf' }));
        setUrl(newUrl);
        return () => {
            if (newUrl) {
                URL.revokeObjectURL(newUrl);
            }
        };
    }, [contents]);

    return (
        <>
            {url && (
                <object
                    data={url}
                    className="w-full flex-no-min-children flex-auto flex-column-reverse"
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
