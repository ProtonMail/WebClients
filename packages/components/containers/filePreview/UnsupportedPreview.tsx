import { c } from 'ttag';

import corruptedPreviewSvg from '@proton/styles/assets/img/errors/broken-image.svg';
import unsupportedPreviewSvg from '@proton/styles/assets/img/errors/preview-unavailable.svg';
import clsx from '@proton/utils/clsx';

import { PrimaryButton } from '../../components';
import { useActiveBreakpoint } from '../../hooks';

interface Props {
    type?: 'file' | 'image' | 'video' | 'audio';
    onDownload?: () => void;
}

const UnsupportedPreview = ({ onDownload, type = 'file' }: Props) => {
    const { isNarrow } = useActiveBreakpoint();

    return (
        <div className="absolute-center text-center w-full px-4">
            <img
                className="mb-4 w80p"
                src={type === 'file' ? unsupportedPreviewSvg : corruptedPreviewSvg}
                alt={c('Info').t`Unsupported file`}
                data-testid="file-preview:unsupported-preview-image"
            />

            <h2
                className={clsx(['p-1 text-bold', isNarrow && 'h3'])}
                data-testid="file-preview:unsupported-preview-text"
            >
                {c('Info').t`Preview for this file type is not supported`}
            </h2>

            {onDownload && (
                <PrimaryButton size={!isNarrow ? 'large' : undefined} className="text-bold" onClick={onDownload}>{c(
                    'Action'
                ).t`Download`}</PrimaryButton>
            )}
        </div>
    );
};

export default UnsupportedPreview;
