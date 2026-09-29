import type { MouseEventHandler, ReactElement, RefObject } from 'react';

import { c } from 'ttag';

import Spotlight from '@proton/components/components/spotlight/Spotlight';

interface ArtifactPanelSpotlightContentProps {
    isGuest: boolean;
}

const ArtifactPanelSpotlightContent = ({ isGuest }: ArtifactPanelSpotlightContentProps) => {
    const createArtifact = <b key="create-artifact">{c('collider_2025: Action').t`Create artifact`}</b>;
    const tools = <b key="tools">{c('collider_2025: Button').t`Tools`}</b>;
    const settings = <b key="settings">{c('collider_2025: Spotlight').t`Settings`}</b>;

    return (
        <div className="flex flex-column flex-nowrap items-start">
            <p className="text-lg text-bold m-0 mb-1">{c('collider_2025: Spotlight')
                .t`Artifacts are now on by default`}</p>
            {!isGuest ? (
                <>
                    <p className="m-0 text-sm color-weak">{c('collider_2025: Spotlight')
                        .t`Longer documents, code and slides open here so you can edit, download or save them to Drive.`}</p>
                    <p className="m-0 mt-2 text-sm color-weak">
                        {
                            // translator: createArtifact is the "Create artifact" toggle, tools is the "Tools" composer menu, settings is the "Settings" modal
                            c('collider_2025: Spotlight')
                                .jt`To stop this, turn off ${createArtifact} in ${tools} for this chat, or in ${settings} for all chats.`
                        }
                    </p>
                </>
            ) : (
                <>
                    <p className="m-0 text-sm color-weak">{c('collider_2025: Spotlight')
                        .t`Longer documents, code and slides open here so you can edit and download them.`}</p>
                    <p className="m-0 mt-2 text-sm color-weak">
                        {
                            // translator: createArtifact is the "Create artifact" toggle, tools is the "Tools" composer menu
                            c('collider_2025: Spotlight')
                                .jt`To stop this, turn off ${createArtifact} in ${tools} for this chat.`
                        }
                    </p>
                </>
            )}
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
