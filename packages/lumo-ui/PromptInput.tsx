import type { KeyboardEvent } from 'react';
import { useEffect, useRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import lumoArrow from '@proton/styles/assets/img/illustrations/lumo-arrow.svg';
import lumoStop from '@proton/styles/assets/img/illustrations/lumo-stop.svg';
import clsx from '@proton/utils/clsx';

interface Props {
    value: string;
    onChange: (value: string) => void;
    /** Called on Enter (without Shift) or the send button — the host decides what to do with `value`. */
    onSubmit: () => void;
    /** Called by the stop button while generating; when omitted no stop button is shown. */
    onStop?: () => void;
    /** Actively working: shows stop in place of send, blocks Enter. Awaiting a user decision does not count. */
    isGenerating?: boolean;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
}

/**
 * The chat composer: an auto-growing text field with a circular send button pinned bottom-right, and a
 * stop button in its place while generating — matching lumo.proton.me. The button is positioned out of flow,
 * so it appearing/disappearing never reflows the text or changes the box height — only the typed content
 * does (via auto-grow). Purely presentational; the host owns the value and the submit/stop intent. Uses
 * a native textarea so the design library stays below `@proton/components` (no dependency on its form
 * controls).
 */
const PromptInput = ({ value, onChange, onSubmit, onStop, isGenerating, disabled, placeholder, className }: Props) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-grow: reset to a single row, then expand to fit the content up to the CSS max-height.
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [value]);

    const submit = () => {
        if (!value.trim() || isGenerating || disabled) {
            return;
        }
        onSubmit();
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            submit();
        }
    };

    return (
        <div className={clsx('lumo-prompt-input', className)}>
            <textarea
                ref={textareaRef}
                className="lumo-prompt-input__field resize-none"
                rows={1}
                value={value}
                disabled={disabled}
                onChange={(event) => onChange(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder ?? c('Placeholder').t`Ask anything…`}
            />
            {isGenerating && onStop ? (
                <Button icon pill color="norm" className="lumo-prompt-input__send" onClick={onStop}>
                    <img src={lumoStop} alt={c('Action').t`Stop`} />
                </Button>
            ) : (
                value.trim() && (
                    <Button
                        icon
                        pill
                        color="norm"
                        className="lumo-prompt-input__send"
                        disabled={disabled}
                        onClick={submit}
                    >
                        <img src={lumoArrow} alt={c('Action').t`Send`} />
                    </Button>
                )
            )}
        </div>
    );
};

export default PromptInput;
