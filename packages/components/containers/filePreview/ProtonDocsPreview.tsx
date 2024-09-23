import type { FC } from 'react';

import { c } from 'ttag';

import PrimaryButton from '@proton/components/components/button/PrimaryButton';
import { getOpenInDocsString } from '@proton/shared/lib/drive/translations';
import unsupportedPreviewSvg from '@proton/styles/assets/img/errors/preview-unavailable.svg';
import clsx from '@proton/utils/clsx';

import { useActiveBreakpoint } from '../../hooks';

interface Props {
    isPublic?: boolean;
    isPublicDocsAvailable?: boolean;
    onOpenInDocs?: () => void;
}

export const ProtonDocsPreview: FC<Props> = ({ isPublic, isPublicDocsAvailable, onOpenInDocs }) => {
    const { viewportWidth } = useActiveBreakpoint();

    let message = c('Info').t`Preview for this file type is not supported`;
    let subtext = undefined;

    if (isPublic && !isPublicDocsAvailable) {
        message = c('Info').t`Public sharing of documents is not yet supported.`;
        subtext = c('Info').t`Please ask the owner to directly invite you to the document.`;
    } else {
        message = c('Info').t`Preview of documents is not yet supported.`;
        subtext = c('Info').t`Please open the document to view it.`;
    }

    return (
        <div className="absolute inset-center text-center w-full px-4">
            <img
                className="mb-4 w-custom"
                style={{ '--w-custom': '5rem' }}
                src={unsupportedPreviewSvg}
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

            {isPublic && onOpenInDocs && (
                <PrimaryButton
                    size={!viewportWidth['<=small'] ? 'large' : undefined}
                    className="text-bold mt-8"
                    onClick={onOpenInDocs}
                >
                    {getOpenInDocsString()}
                </PrimaryButton>
            )}
        </div>
    );
};
