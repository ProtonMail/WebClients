import { clsx } from 'clsx';

import type { RefObjectReact18Compat } from '@proton/atoms/helpers/RefObjectReact18Compat';

import type { ArtifactActionMeta } from '../../../types';
import { getArtifactActionLabel } from './artifactActionPrompts';
import { ARTIFACT_TYPE_CONFIG } from './artifactTypeConfig';

interface ArtifactActionUserMessageProps {
    artifactAction: ArtifactActionMeta;
    isCollapsed: boolean;
    contentRef: RefObjectReact18Compat<HTMLDivElement>;
}

export const ArtifactActionUserMessage = ({
    artifactAction,
    isCollapsed,
    contentRef,
}: ArtifactActionUserMessageProps) => {
    const { kind, artifactTitle, artifactType, selection, userInstruction } = artifactAction;
    const { icon: Icon, badgeLabel } = ARTIFACT_TYPE_CONFIG[artifactType];

    return (
        <div className="flex flex-column gap-3 w-full">
            <div className="flex flex-row flex-wrap items-center gap-2">
                <span className="lumo-body-small lumo-color-glyph">{getArtifactActionLabel(kind)}</span>
                <span className="artifact-type-badge flex flex-row shrink-0 items-center gap-1 lumo-bg-control-fill-mid">
                    <Icon size={3} />
                    <span className="lumo-label-small">{badgeLabel}</span>
                </span>
                <span className="whitespace-nowrap overflow-hidden lumo-body-small text-ellipsis lumo-color-glyph-mid">
                    {artifactTitle}
                </span>
            </div>
            <div
                ref={contentRef}
                className={clsx(
                    'p-3 overflow-hidden border lumo-border radius-12 lumo-bg-control-fill',
                    isCollapsed && 'line-clamp-3'
                )}
            >
                <pre className="whitespace-pre-wrap break-words m-0 lumo-body-small lumo-font-mono lumo-color-glyph">
                    {selection}
                </pre>
            </div>
            {userInstruction && (
                <p className="whitespace-pre-wrap m-0 lumo-body-small lumo-color-glyph">{userInstruction}</p>
            )}
        </div>
    );
};
