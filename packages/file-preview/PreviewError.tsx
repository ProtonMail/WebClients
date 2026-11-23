import { c } from 'ttag';

import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import corruptedPreviewSvg from '@proton/styles/assets/img/errors/broken-image.svg';
import clsx from '@proton/utils/clsx';

type Props = {
    error: string;
};

export default function PreviewError({ error }: Props) {
    const { viewportWidth } = useActiveBreakpoint();

    return (
        <div className="absolute inset-center text-center w-full px-4">
            <img
                className="mb-4 w-custom"
                style={{ '--w-custom': '5rem' }}
                src={corruptedPreviewSvg}
                alt={c('Info').t`Preview failed to be loaded`}
            />

            <h2 className={clsx(['p-1 text-bold', viewportWidth['<=small'] && 'h3'])}>{c('Info')
                .t`Preview failed to be loaded`}</h2>
            <p className="color-weak">{error}</p>
        </div>
    );
}
