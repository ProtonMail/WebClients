import type { MouseEventHandler, ReactElement, RefObject } from 'react';

import { c } from 'ttag';

import Spotlight from '@proton/components/components/spotlight/Spotlight';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

interface ArtifactPanelSpotlightContentProps {
    isGuest: boolean;
}

const ArtifactPanelSpotlightContent = ({ isGuest }: ArtifactPanelSpotlightContentProps) => {
    const tools = <b key="tools">{c('collider_2025: Button').t`Tools`}</b>;
    const settings = <b key="settings">{c('collider_2025: Spotlight').t`Settings`}</b>;

    return (
        <div className="flex flex-column flex-nowrap items-start">
            <p className="text-lg text-bold m-0 mb-1">{c('collider_2025: Spotlight')
                .t`A new space for your creations`}</p>
            <p className="m-0 text-sm color-weak">{c('collider_2025: Spotlight')
                .t`Documents, code, and web pages now open in a canvas beside your chat. Ask ${LUMO_SHORT_APP_NAME} for changes, compare versions, and download your work.`}</p>
            <p className="m-0 mt-2 text-sm color-weak">
                {isGuest
                    ? // translator: The "creations" toggle can be enabled/disabled per conversation in the Tools dropdown menu in the composer input element. Guest users do not have access to the toggle in the settings modal.
                      c('collider_2025: Spotlight').jt`You can turn off creations in ${tools}.`
                    : // translator: The "creations" toggle can be enabled/disabled per conversation in the Tools dropdown menu in the composer input element; it can also be enabled/disabled globally in the settings modal
                      c('collider_2025: Spotlight').jt`You can turn off creations in ${tools} or ${settings}.`}
            </p>
        </div>
    );
};

interface Props {
    anchorRef: RefObject<HTMLElement>;
    children: ReactElement;
    onClose: MouseEventHandler;
    onDisplayed: () => void;
    isGuest: boolean;
    show: boolean;
}

export const ArtifactPanelSpotlight = ({ anchorRef, children, onClose, onDisplayed, isGuest, show }: Props) => {
    return (
        <Spotlight
            anchorRef={anchorRef}
            content={<ArtifactPanelSpotlightContent isGuest={isGuest} />}
            onClose={onClose}
            onDisplayed={onDisplayed}
            originalPlacement="left"
            show={show}
            type="new"
            className="mt-1"
        >
            {children}
        </Spotlight>
    );
};
