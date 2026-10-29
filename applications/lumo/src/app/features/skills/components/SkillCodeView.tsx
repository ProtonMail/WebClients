import { useRef } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import humanSize from '@proton/shared/lib/helpers/humanSize';

import { LazyProgressiveMarkdownRenderer } from '../../../components/LumoMarkdown/LazyMarkdownComponents';
import { Role } from '../../../types';
import { resolveSkillLink } from '../skillLinks';
import { parseSkillMarkdown } from '../skillMarkdown';
import type { WorkspaceFile } from './skillWorkspace';
import { getWorkspaceFileSize } from './skillWorkspace';

import './SkillCodeView.scss';

export type SkillCodeViewMode = 'code' | 'preview';

interface SkillCodeViewProps {
    file: WorkspaceFile;
    mode: SkillCodeViewMode;
    onChange?: (text: string) => void;
    placeholder?: string;
    autoFocus?: boolean;
    /** Every path in the bundle, so relative links in the preview can open other files. */
    filePaths?: string[];
    onOpenFile?: (path: string) => void;
}

const isMarkdownPath = (path: string) => /\.(md|markdown)$/i.test(path);

export const SkillCodeView = ({
    file,
    mode,
    onChange,
    placeholder,
    autoFocus,
    filePaths,
    onOpenFile,
}: SkillCodeViewProps) => {
    const gutterRef = useRef<HTMLDivElement>(null);
    const { createNotification } = useNotifications();

    if (file.text === undefined) {
        const size = humanSize({ bytes: getWorkspaceFileSize(file) });
        return (
            <div className="skill-code-view skill-code-view--binary flex items-center justify-center p-6 color-weak text-sm">
                {c('collider_2025:Info').t`Binary file, ${size}. It cannot be shown here.`}
            </div>
        );
    }

    if (mode === 'preview' && isMarkdownPath(file.path)) {
        const { frontmatter, body: content } = parseSkillMarkdown(file.text);
        const properties = Object.entries(frontmatter);

        const handleLinkClick = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
            event.preventDefault();
            const target = resolveSkillLink(file.path, href, filePaths ?? []);
            if (target.kind === 'file') {
                onOpenFile?.(target.path);
            } else if (target.kind === 'external') {
                window.open(target.url, '_blank', 'noopener,noreferrer');
            } else if (target.kind === 'missing') {
                createNotification({
                    type: 'warning',
                    text: c('collider_2025:Info').t`${target.path} isn't part of this skill`,
                });
            }
        };

        return (
            <div className="skill-code-view skill-code-view--preview overflow-auto">
                <div className="skill-code-view__document">
                    {properties.length > 0 && (
                        <dl className="skill-code-view__properties">
                            {properties.map(([key, value]) => (
                                <div key={key} className="flex flex-nowrap gap-4">
                                    <dt className="skill-code-view__property-key shrink-0">{key}</dt>
                                    <dd className="m-0 min-w-0 text-break">{value}</dd>
                                </div>
                            ))}
                        </dl>
                    )}
                    <LazyProgressiveMarkdownRenderer
                        content={content}
                        isStreaming={false}
                        enableVegaCharts={false}
                        handleLinkClick={handleLinkClick}
                        message={{
                            id: `skill-file-${file.path}`,
                            content,
                            role: Role.Assistant,
                            conversationId: '',
                            createdAt: new Date(0).toISOString(),
                        }}
                    />
                </div>
            </div>
        );
    }

    const lineCount = Math.max(1, file.text.split('\n').length);

    return (
        <div className="skill-code-view flex flex-nowrap overflow-hidden">
            <div ref={gutterRef} aria-hidden className="skill-code-view__gutter shrink-0 text-right color-hint">
                {Array.from({ length: lineCount }, (_, i) => (
                    <div key={i}>{i + 1}</div>
                ))}
            </div>
            <textarea
                className="skill-code-view__textarea flex-1 border-none bg-transparent"
                value={file.text}
                readOnly={!onChange}
                onChange={(event) => onChange?.(event.target.value)}
                onScroll={(event) => {
                    if (gutterRef.current) {
                        gutterRef.current.scrollTop = event.currentTarget.scrollTop;
                    }
                }}
                placeholder={placeholder}
                spellCheck={false}
                aria-label={file.path}
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus={autoFocus}
            />
        </div>
    );
};
