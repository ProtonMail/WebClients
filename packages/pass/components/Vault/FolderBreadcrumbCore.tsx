import { type FC, Fragment, type ReactNode, useLayoutEffect, useMemo, useRef, useState } from 'react';

import useElementRect from '@proton/components/hooks/useElementRect';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import clsx from '@proton/utils/clsx';

import type { FolderData } from '../../types';
import type { VaultColor } from '../../types/protobuf/vault-v1.static';
import { PassFolderIcon } from '../Folders/PassFolderIcon';
import type { VaultIconName } from './VaultIcon';
import { VaultIcon } from './VaultIcon';

type FolderPathSegment = {
    key: string;
    label: string;
    icon?: ReactNode;
    title?: string;
    highlight?: boolean;
};

type Props = {
    shareId: string;
    vaultName: string;
    vaultColor?: VaultColor;
    vaultIcon?: VaultIconName;
    path: FolderData[];
    className?: string;
};

const toTitle = (segments: FolderPathSegment[]) => segments.map((segment) => segment.label).join(' > ');

const renderSegment = ({ label, icon, title, highlight }: FolderPathSegment) => {
    const content = (
        <>
            {icon}
            <span className="text-ellipsis min-w-0" title={title ?? label}>
                {label}
            </span>
        </>
    );

    return highlight ? (
        <span className="flex flex-nowrap items-center gap-1 min-w-0 color-norm">{content}</span>
    ) : (
        content
    );
};

const Separator = <IcChevronRight size={3} className="shrink-0" />;

const collapseToLevel = (segments: FolderPathSegment[], level: number): FolderPathSegment[] => {
    if (level === 0) return segments;

    const middle = segments.slice(1, -1);
    const current = { ...segments[segments.length - 1], title: toTitle(segments) };

    if (level === 1 && middle.length) {
        return [segments[0], { key: 'middle', label: '…', title: toTitle(middle) }, current];
    }

    return [current];
};

/** Renders `vault › folder › subfolder` or `vault > ... > subfolder`
 * or `subfolder` depending on width */
export const FolderBreadcrumbCore: FC<Props> = ({ shareId, vaultName, vaultColor, vaultIcon, path, className }) => {
    const segments = useMemo<FolderPathSegment[]>(
        () => [
            {
                key: shareId,
                label: vaultName,
                icon: <VaultIcon icon={vaultIcon} color={vaultColor} size={3} className="shrink-0" />,
            },
            ...path.map((folder, index) => ({
                key: folder.folderId,
                label: folder.name,
                icon: <PassFolderIcon size={3} hasChildren={index < path.length - 1} />,
                highlight: index === path.length - 1,
            })),
        ],
        [shareId, vaultName, vaultColor, vaultIcon, path]
    );

    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const rect = useElementRect(containerRef);
    const [collapseLevel, setCollapseLevel] = useState(0);

    /** 0: full path, 1: middle collapsed to `…`, 2: current folder only */
    const maxLevel = Math.min(segments.length - 1, 2);
    const width = rect?.width;
    const segKey = segments.map((segment) => segment.key).join('|');

    /** Re-expand on width/path change, then re-measure below */
    useLayoutEffect(() => setCollapseLevel(0), [width, segKey]);

    useLayoutEffect(() => {
        if (collapseLevel >= maxLevel) return;
        const container = containerRef.current;
        const content = contentRef.current;
        if (container && content && content.offsetWidth > container.clientWidth) {
            setCollapseLevel(collapseLevel + 1);
        }
    }, [collapseLevel, maxLevel, width, segKey]);

    const visible = collapseToLevel(segments, collapseLevel);

    return (
        <div ref={containerRef} className={clsx('text-sm overflow-hidden', className)}>
            <div
                ref={contentRef}
                className="flex items-center flex-nowrap gap-1 color-weak"
                // `max-content` sizes the row to its full width so we can detect overflow
                {...(collapseLevel < maxLevel ? { style: { width: 'max-content' } } : {})}
            >
                {visible.map((segment, index) => (
                    <Fragment key={segment.key}>
                        {index > 0 && Separator}
                        {renderSegment(segment)}
                    </Fragment>
                ))}
            </div>
        </div>
    );
};
