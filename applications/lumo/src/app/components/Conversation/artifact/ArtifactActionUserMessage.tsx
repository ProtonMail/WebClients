import { clsx } from 'clsx';

import { IcCode } from '@proton/icons/icons/IcCode';
import { IcFileLines } from '@proton/icons/icons/IcFileLines';

import type { ArtifactActionMeta } from '../../../types';
import { getArtifactActionLabel } from './artifactActionPrompts';

interface ArtifactActionUserMessageProps {
    artifactAction: ArtifactActionMeta;
    isCollapsed: boolean;
    contentRef: React.RefObject<HTMLDivElement>;
}

export const ArtifactActionUserMessage = ({
    artifactAction,
    isCollapsed,
    contentRef,
}: ArtifactActionUserMessageProps) => {
    const { kind, artifactTitle, artifactType, selection, userInstruction } = artifactAction;
    const typeLabel = artifactType === 'code' ? 'CODE' : 'DOC';

    return (
        <div className="flex flex-column gap-3 w-full">
            <div className="flex flex-row flex-wrap items-center gap-2">
                <span className="text-sm font-semibold color-norm">{getArtifactActionLabel(kind)}</span>
                <span className="artifact-type-badge flex flex-row items-center gap-1 shrink-0 bg-strong">
                    {artifactType === 'code' ? <IcCode size={3} /> : <IcFileLines size={3} />}
                    <span className="text-xs font-bold">{typeLabel}</span>
                </span>
                <span className="text-sm color-weak text-ellipsis overflow-hidden whitespace-nowrap">
                    {artifactTitle}
                </span>
            </div>
            <div
                ref={contentRef}
                className={clsx(
                    'rounded-lg border border-weak bg-weak p-3 overflow-hidden',
                    isCollapsed && 'line-clamp-3'
                )}
            >
                <pre className="text-monospace text-sm m-0 color-norm whitespace-pre-wrap break-words">{selection}</pre>
            </div>
            {userInstruction && <p className="text-sm color-norm m-0 whitespace-pre-wrap">{userInstruction}</p>}
        </div>
    );
};

export default ArtifactActionUserMessage;
