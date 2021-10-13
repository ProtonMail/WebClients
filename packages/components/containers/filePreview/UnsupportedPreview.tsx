import { c } from 'ttag';
import unsupportedPreviewSvg from '@proton/styles/assets/img/errors/preview-unavailable.svg';
import corruptedPreviewSvg from '@proton/styles/assets/img/errors/broken-image.svg';
import { PrimaryButton } from '../../components';
import { useActiveBreakpoint } from '../../hooks';
import { classnames } from '../../helpers';

interface Props {
    type?: 'file' | 'image' | 'video';
    onSave?: () => void;
}

const UnsupportedPreview = ({ onSave, type = 'file' }: Props) => {
    const { isNarrow } = useActiveBreakpoint();

    return (
        <div className="centered-absolute text-center w100 pl1 pr1">
            <img
                className={classnames(['mb1', isNarrow ? 'w150p' : 'w200p'])}
                src={type === 'file' ? unsupportedPreviewSvg : corruptedPreviewSvg}
                alt={c('Info').t`Unsupported file`}
            />

            <h2 className={classnames(['p0-25 text-bold', isNarrow && 'h3'])}>{c('Info').t`No preview available`}</h2>

            {onSave && (
                <PrimaryButton size={!isNarrow ? 'large' : undefined} className="text-bold" onClick={onSave}>{c(
                    'Action'
                ).t`Download`}</PrimaryButton>
            )}
        </div>
    );
};

export default UnsupportedPreview;
