import { FC, useEffect, useRef, useState } from 'react';

import { renderAsync } from 'docx-preview';
import DOMPurify from 'dompurify';

import { randomHexString4 } from '@proton/shared/lib/helpers/uid';
import mergeUint8Arrays from '@proton/utils/mergeUint8Arrays';

import UnsupportedPreview from './UnsupportedPreview';

interface Props {
    contents?: Uint8Array[];
    onDownload?: () => void;
}
const WordPreview: FC<Props> = ({ contents, onDownload }) => {
    const [isError, setError] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const render = async () => {
            if (!contents) {
                throw new Error('Empty contents');
            }

            const element = document.createElement('div');

            await renderAsync(mergeUint8Arrays(contents), element, element, {
                // Ensure completely unique class names since it is injected in DOM
                className: `docx-${randomHexString4()}`,
                breakPages: true,
            });
            DOMPurify.sanitize(element, { IN_PLACE: true });

            return element;
        };

        render()
            .then((element) => {
                if (!ref.current) {
                    throw new Error('Preview ref not ready');
                }

                ref.current.innerHTML = '';
                ref.current.appendChild(element);
            })
            .catch(() => {
                setError(true);
            });
    }, [contents]);

    if (isError) {
        return (
            <div className="flex flex-item-fluid-auto relative">
                <UnsupportedPreview onDownload={onDownload} type="file" />
            </div>
        );
    }

    return <div ref={ref} className="file-preview-container"></div>;
};

export default WordPreview;
