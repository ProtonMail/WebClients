import React, { useState, useEffect } from 'react';
interface Props {
    filename: string;
    contents?: Uint8Array[];
}
const PDFPreview = ({ filename, contents }: Props) => {
    const [url, setUrl] = useState();

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
                <object data={url} className="w100 flex-item-fluid" type="application/pdf" title={filename}>
                    <embed src={url} type="application/pdf" />
                </object>
            )}
        </>
    );
};

export default PDFPreview;
