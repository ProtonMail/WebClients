import { useLayoutEffect, useMemo, useRef } from 'react';

import { splitSkillTokens } from '../../features/skills/skillInvocation';

import './SkillTokenHighlight.scss';

const MIRRORED_STYLES = [
    'boxSizing',
    'fontFamily',
    'fontSize',
    'fontWeight',
    'fontStyle',
    'letterSpacing',
    'lineHeight',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'textIndent',
    'tabSize',
    'wordSpacing',
] as const;

/** Splits the draft for highlighting; `isActive` is false when it contains no known skill. */
export const useSkillTokens = (value: string, handles: ReadonlySet<string>) =>
    useMemo(() => {
        const parts = splitSkillTokens(value, handles);
        return { parts, isActive: parts.some((part) => part.isSkill) };
    }, [value, handles]);

interface SkillTokenHighlightProps {
    textareaRef: React.RefObject<HTMLTextAreaElement>;
    parts: { text: string; isSkill: boolean }[];
}

/**
 * Renders the composer text behind a transparent textarea so `/skill` tokens can be coloured.
 * Text metrics are copied from the textarea so every glyph lines up with the caret.
 */
export const SkillTokenHighlight = ({ textareaRef, parts }: SkillTokenHighlightProps) => {
    const backdropRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const textarea = textareaRef.current;
        const backdrop = backdropRef.current;
        if (!textarea || !backdrop) {
            return;
        }
        const sync = () => {
            const computed = window.getComputedStyle(textarea);
            for (const property of MIRRORED_STYLES) {
                backdrop.style[property] = computed[property];
            }
            backdrop.scrollTop = textarea.scrollTop;
        };
        const syncScroll = () => {
            backdrop.scrollTop = textarea.scrollTop;
        };
        sync();
        const observer = new ResizeObserver(sync);
        observer.observe(textarea);
        textarea.addEventListener('scroll', syncScroll);
        return () => {
            observer.disconnect();
            textarea.removeEventListener('scroll', syncScroll);
        };
    }, [textareaRef]);

    useLayoutEffect(() => {
        if (backdropRef.current && textareaRef.current) {
            backdropRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    });

    return (
        <div ref={backdropRef} className="skill-token-highlight" aria-hidden>
            {parts.map((part, index) =>
                part.isSkill ? (
                    <span key={index} className="skill-token-highlight__token">
                        {part.text}
                    </span>
                ) : (
                    part.text
                )
            )}
            {/* A trailing newline needs a character after it to take up a line, as in the textarea. */}
            {'\u200b'}
        </div>
    );
};
