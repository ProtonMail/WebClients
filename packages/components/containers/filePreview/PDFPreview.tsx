import React, { useState, useEffect } from 'react';

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
                    className="w100 flex-no-min-children flex-item-fluid-auto"
                    type="application/pdf"
                    title={filename}
                >
                    <embed src={url} className="flex" type="application/pdf" />
                </object>
            )}
        </>
    );
};

export default PDFPreview;
