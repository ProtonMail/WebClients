import { c } from 'ttag';

import corruptedPreviewSvg from '@proton/styles/assets/img/errors/broken-image.svg';
import unsupportedPreviewSvg from '@proton/styles/assets/img/errors/preview-unavailable.svg';

import { PrimaryButton } from '../../components';
import { classnames } from '../../helpers';
import { useActiveBreakpoint } from '../../hooks';

interface Props {
    type?: 'file' | 'image' | 'video' | 'audio';
    onDownload?: () => void;
}

const UnsupportedPreview = ({ onDownload, type = 'file' }: Props) => {
    const { isNarrow } = useActiveBreakpoint();

    return (
        <div className="absolute-center text-center w100 pl1 pr1">
            <img
                className="mb1 w80p"
                src={type === 'file' ? unsupportedPreviewSvg : corruptedPreviewSvg}
                alt={c('Info').t`Unsupported file`}
            />

            <h2 className={classnames(['p0-25 text-bold', isNarrow && 'h3'])}>{c('Info').t`No preview available`}</h2>

            {onDownload && (
                <PrimaryButton size={!isNarrow ? 'large' : undefined} className="text-bold" onClick={onDownload}>{c(
                    'Action'
                ).t`Download`}</PrimaryButton>
            )}
        </div>
    );
};

export default UnsupportedPreview;
