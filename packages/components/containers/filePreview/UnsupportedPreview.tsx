import { c } from 'ttag';

import PrimaryButton from '@proton/components/components/button/PrimaryButton';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import corruptedPreviewSvg from '@proton/styles/assets/img/errors/broken-image.svg';
import unsupportedPreviewSvg from '@proton/styles/assets/img/errors/preview-unavailable.svg';
import clsx from '@proton/utils/clsx';

interface Props {
    type?: 'file' | 'image' | 'video' | 'audio';
    onDownload?: () => void;
    browser?: boolean;
    tooLarge?: boolean;
}

const UnsupportedPreview = ({ onDownload, type = 'file', browser = false, tooLarge = false }: Props) => {
    const { viewportWidth } = useActiveBreakpoint();

    let message = c('Info').t`Preview for this file type is not supported`;
    let subtext = undefined;

    if (browser) {
        message = c('Info').t`Preview for this file type is currently not supported on this browser.`;
        subtext = c('Info').t`Please use another browser or download the file.`;
    } else if (tooLarge) {
        message = c('Info').t`This file is too large to preview`;
    }

    return (
        <div className="absolute inset-center text-center w-full px-4">
            <img
                className="mb-4 w-custom"
                style={{ '--w-custom': '5rem' }}
                src={type === 'file' ? unsupportedPreviewSvg : corruptedPreviewSvg}
                alt={c('Info').t`Unsupported file`}
                data-testid="file-preview:unsupported-preview-image"
            />

            <h2
                className={clsx(['p-1 text-bold', viewportWidth['<=small'] && 'h3'])}
                data-testid="file-preview:unsupported-preview-text"
            >
                {message}
            </h2>
            {subtext && <h3 className="pb-1">{subtext}</h3>}

            {onDownload && (
                <PrimaryButton
                    size={!viewportWidth['<=small'] ? 'large' : undefined}
                    className="text-bold mt-8"
                    onClick={onDownload}
                >{c('Action').t`Download`}</PrimaryButton>
            )}
        </div>
    );
};

export default UnsupportedPreview;
