import { Fragment, useMemo } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';

import type { Memory } from '../../../redux/slices/lumoUserSettings';
import type { DiffSegment, MemoryChange } from '../../../util/memoryDiff';
import { diffWords, groupMemoryChanges } from '../../../util/memoryDiff';
import { partitionMemories } from '../../../util/memoryHelpers';
import { LumoIcon } from '../../LumoIcon/LumoIcon';

import './MemoryOptimizePreviewModal.scss';

interface MemoryOptimizePreviewModalProps extends ModalProps {
    /** Memories as they are stored now. */
    current: Memory[];
    /** Memories as they would be stored after optimization. */
    optimized: Memory[];
    onApply: () => void;
    onDiscard: () => void;
}

const contentKey = (memory: Memory) => memory.content.trim().toLowerCase();

const Segments = ({ segments }: { segments: DiffSegment[] }) => (
    <>
        {segments.map((segment, index) => (
            <Fragment key={index}>
                {index > 0 && ' '}
                {segment.type === 'same' ? (
                    segment.text
                ) : (
                    <span className={segment.type === 'removed' ? 'memory-diff-removed' : 'memory-diff-added'}>
                        {segment.text}
                    </span>
                )}
            </Fragment>
        ))}
    </>
);

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`rounded border border-weak p-3 text-sm lh130 text-break ${className}`}>{children}</div>
);

const getChangeLabel = (change: MemoryChange) => {
    if (change.before.length > 1) {
        return c('collider_2025: Label').t`Merged`;
    }
    if (change.before.length === 1 && change.after) {
        return c('collider_2025: Label').t`Reworded`;
    }
    if (change.after) {
        return c('collider_2025: Label').t`New`;
    }
    return c('collider_2025: Label').t`Removed`;
};

const ChangeItem = ({ change }: { change: MemoryChange }) => {
    const afterText = change.after?.content ?? '';
    // Compare the new text against every old entry so merged memories only highlight genuinely new words.
    const afterSegments = change.after
        ? diffWords(change.before.map((memory) => memory.content).join(' '), afterText).after
        : [];

    return (
        <li className="flex flex-column flex-nowrap gap-2">
            <span className="text-xs text-semibold color-weak text-uppercase">{getChangeLabel(change)}</span>
            {change.before.map((memory) => (
                <Card key={memory.id} className="bg-weak">
                    {change.after ? (
                        <Segments segments={diffWords(memory.content, afterText).before} />
                    ) : (
                        <span className="memory-diff-removed">{memory.content}</span>
                    )}
                </Card>
            ))}
            {change.before.length > 0 && change.after && (
                <span className="flex justify-center color-weak" aria-hidden="true">
                    <LumoIcon name="ChevronDown" size={16} />
                </span>
            )}
            {change.after && (
                <Card>
                    {change.before.length === 0 ? (
                        <span className="memory-diff-added">{afterText}</span>
                    ) : (
                        <Segments segments={afterSegments} />
                    )}
                </Card>
            )}
        </li>
    );
};

export const MemoryOptimizePreviewModal = ({
    current,
    optimized,
    onApply,
    onDiscard,
    ...modalProps
}: MemoryOptimizePreviewModalProps) => {
    const { changes, unchangedCount } = useMemo(() => {
        const currentGenerated = partitionMemories(current).generated;
        const optimizedGenerated = partitionMemories(optimized).generated;
        const currentKeys = new Set(currentGenerated.map(contentKey));
        const optimizedKeys = new Set(optimizedGenerated.map(contentKey));

        return {
            changes: groupMemoryChanges(
                currentGenerated.filter((memory) => !optimizedKeys.has(contentKey(memory))),
                optimizedGenerated.filter((memory) => !currentKeys.has(contentKey(memory)))
            ),
            unchangedCount: optimizedGenerated.filter((memory) => currentKeys.has(contentKey(memory))).length,
        };
    }, [current, optimized]);

    return (
        <ModalTwo {...modalProps} onClose={onDiscard} size="large">
            <ModalTwoHeader title={c('collider_2025: Title').t`Review optimized memories`} />
            <ModalTwoContent>
                <p className="mt-0 mb-2 color-weak text-sm">
                    {c('collider_2025: Description')
                        .t`Nothing has changed yet. Review the proposed changes below, then apply them or keep your current memories. Memories you wrote yourself are never changed.`}
                </p>
                <p className="mt-0 mb-4 text-sm color-weak">
                    <span className="memory-diff-removed">{c('collider_2025: Label').t`Removed`}</span>{' '}
                    <span className="memory-diff-added">{c('collider_2025: Label').t`Added`}</span>
                </p>

                <ul className="unstyled m-0 p-0 flex flex-column flex-nowrap gap-5">
                    {changes.map((change) => (
                        <ChangeItem
                            key={`${change.before.map((m) => m.id).join('+')}>${change.after?.id ?? ''}`}
                            change={change}
                        />
                    ))}
                </ul>

                {unchangedCount > 0 && (
                    <p className="mt-4 mb-0 text-sm color-weak">
                        {c('collider_2025: Info').ngettext(
                            msgid`${unchangedCount} chat-based memory stays the same.`,
                            `${unchangedCount} chat-based memories stay the same.`,
                            unchangedCount
                        )}
                    </p>
                )}
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onDiscard}>{c('collider_2025: Action').t`Keep current memories`}</Button>
                <Button color="norm" onClick={onApply}>
                    {c('collider_2025: Action').t`Apply changes`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
