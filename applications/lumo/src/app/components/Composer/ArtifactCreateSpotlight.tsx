import type { MouseEventHandler, ReactElement, RefObject } from 'react';

import { c } from 'ttag';

import Spotlight from '@proton/components/components/spotlight/Spotlight';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

interface Props {
    anchorRef: RefObject<HTMLElement>;
    children: ReactElement;
    onClose: MouseEventHandler;
    show: boolean;
}

export const ArtifactCreateSpotlightContent = () => {
    return (
        <div className="flex flex-column flex-nowrap items-start">
            <p className="text-lg text-bold m-0 mb-1">{c('collider_2025: Spotlight')
                .t`Create artifacts with ${LUMO_SHORT_APP_NAME}`}</p>
            <p className="m-0 text-sm color-weak">{c('collider_2025: Spotlight')
                .t`Turn ideas into documents, code, and more. Open Tools to get started.`}</p>
        </div>
    );
};

export const ArtifactCreateSpotlight = ({ anchorRef, children, onClose, show }: Props) => {
    return (
        <Spotlight
            anchorRef={anchorRef}
            content={<ArtifactCreateSpotlightContent />}
            onClose={onClose}
            originalPlacement="bottom-start"
            show={show}
            type="new"
            className="mt-1"
        >
            {children}
        </Spotlight>
    );
};
