import { c } from 'ttag';

import corruptedPreviewSvg from '@proton/styles/assets/img/errors/broken-image.svg';

import { classnames } from '../../helpers';
import { useActiveBreakpoint } from '../../hooks';

type Props = {
    error: string;
};

export default function PreviewError({ error }: Props) {
    const { isNarrow } = useActiveBreakpoint();

    return (
        <div className="absolute-center text-center w100 pl1 pr1">
            <img className="mb1 w80p" src={corruptedPreviewSvg} alt={c('Info').t`Preview failed to be loaded`} />

            <h2 className={classnames(['p0-25 text-bold', isNarrow && 'h3'])}>{c('Info')
                .t`Preview failed to be loaded`}</h2>
            <p className="color-weak">{error}</p>
        </div>
    );
}
