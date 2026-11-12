import type { KeyboardEvent } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import TextAreaTwo from '@proton/components/components/v2/input/TextArea';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';

import './SkillLumoPrompt.scss';

const getExamples = () => [
    {
        label: c('collider_2025:Label').t`Weekly status report`,
        prompt: c('collider_2025:Info')
            .t`Turn my notes from the week into a status report with wins, blockers and next steps, in a professional but friendly tone.`,
    },
    {
        label: c('collider_2025:Label').t`Meeting notes to actions`,
        prompt: c('collider_2025:Info')
            .t`Read meeting notes or a transcript and pull out decisions, action items with owners and due dates, and open questions.`,
    },
    {
        label: c('collider_2025:Label').t`Reply to customers`,
        prompt: c('collider_2025:Info')
            .t`Draft replies to customer support emails: acknowledge the issue, answer clearly, keep it under 150 words and end with a next step.`,
    },
    {
        label: c('collider_2025:Label').t`Code review checklist`,
        prompt: c('collider_2025:Info')
            .t`Review a pull request diff for bugs, security issues, readability and missing tests, and list findings by severity.`,
    },
];

const submitOnEnter = (onSubmit: () => void) => (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
        event.preventDefault();
        onSubmit();
    }
};

interface SkillLumoBriefProps {
    value: string;
    onValue: (value: string) => void;
    onSubmit: () => void;
}

/** First step of creating a skill: say what it should do, and Lumo drafts it. */
export const SkillLumoBrief = ({ value, onValue, onSubmit }: SkillLumoBriefProps) => (
    <div className="flex flex-column flex-nowrap gap-4">
        <div className="flex flex-nowrap items-start gap-3">
            <span className="skill-lumo-brief__badge flex items-center justify-center shrink-0 color-primary">
                <LumoIcon name="Sparkles" size={20} />
            </span>
            <div className="flex flex-column gap-1">
                <h2 className="m-0 text-lg text-semibold">{c('collider_2025:Title').t`What should this skill do?`}</h2>
                <p className="m-0 color-weak">
                    {c('collider_2025:Info')
                        .t`Describe the task and when ${LUMO_SHORT_APP_NAME} should use it. ${LUMO_SHORT_APP_NAME} drafts the name, description and instructions, and you can review everything before saving.`}
                </p>
            </div>
        </div>
        <div className="skill-lumo-prompt p-3">
            <TextAreaTwo
                unstyled
                autoGrow
                minRows={5}
                rows={10}
                className="skill-lumo-prompt__input"
                value={value}
                onValue={onValue}
                placeholder={c('collider_2025:Placeholder')
                    .t`e.g. Turn my notes from the week into a status report with wins, blockers and next steps`}
                aria-label={c('collider_2025:Label').t`What should this skill do?`}
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                onKeyDown={submitOnEnter(() => value.trim() && onSubmit())}
            />
        </div>
        <div className="flex flex-column gap-2">
            <span className="text-sm color-weak">{c('collider_2025:Label').t`Or start from an example`}</span>
            <div className="flex flex-wrap gap-2">
                {getExamples().map((example) => (
                    <Button
                        key={example.label}
                        size="small"
                        shape="outline"
                        pill
                        onClick={() => onValue(example.prompt)}
                    >
                        {example.label}
                    </Button>
                ))}
            </div>
        </div>
    </div>
);

interface SkillLumoPromptProps {
    value: string;
    onValue: (value: string) => void;
    onSubmit: () => void;
    onStop: () => void;
    generating: boolean;
    /** Whether the skill already has content, so the request revises it rather than starting over. */
    hasDraft: boolean;
    onUndo?: () => void;
}

/** Bar above the skill editor to draft or revise the skill with Lumo. */
export const SkillLumoPrompt = ({
    value,
    onValue,
    onSubmit,
    onStop,
    generating,
    hasDraft,
    onUndo,
}: SkillLumoPromptProps) => {
    const canSubmit = !!value.trim() && !generating;
    const title = hasDraft
        ? c('collider_2025:Title').t`Refine with ${LUMO_SHORT_APP_NAME}`
        : c('collider_2025:Title').t`Draft with ${LUMO_SHORT_APP_NAME}`;
    const placeholder = hasDraft
        ? c('collider_2025:Placeholder').t`Ask for a change, like "make it shorter" or "add a section on tone"`
        : c('collider_2025:Placeholder')
              .t`Describe what the skill should do, and when ${LUMO_SHORT_APP_NAME} should use it`;

    return (
        <section
            className={clsx(
                'skill-lumo-prompt skill-lumo-prompt--refine flex flex-column flex-nowrap gap-1 px-3 py-2 mb-2',
                generating && 'is-generating'
            )}
            aria-label={title}
        >
            <div className="flex flex-nowrap items-center gap-2">
                <LumoIcon
                    name="Sparkles"
                    size={16}
                    className={generating ? 'skill-lumo-prompt__icon--busy color-primary' : 'color-primary'}
                />
                <span className="flex-1 text-sm text-semibold color-primary" aria-live="polite">
                    {generating ? c('collider_2025:Info').t`${LUMO_SHORT_APP_NAME} is writing your skill…` : title}
                </span>
                {onUndo && !generating && (
                    <Button size="small" shape="ghost" onClick={onUndo}>
                        <span className="flex flex-nowrap items-center gap-1">
                            <LumoIcon name="Undo2" size={14} />
                            {c('collider_2025:Action').t`Undo`}
                        </span>
                    </Button>
                )}
            </div>
            <div className="flex flex-nowrap items-end gap-2">
                <TextAreaTwo
                    unstyled
                    autoGrow
                    minRows={1}
                    rows={4}
                    className="skill-lumo-prompt__input flex-1"
                    value={value}
                    onValue={onValue}
                    disabled={generating}
                    placeholder={placeholder}
                    aria-label={title}
                    onKeyDown={submitOnEnter(() => canSubmit && onSubmit())}
                />
                {generating ? (
                    <Button
                        icon
                        size="small"
                        shape="outline"
                        className="shrink-0"
                        onClick={onStop}
                        aria-label={c('collider_2025:Action').t`Stop`}
                    >
                        <LumoIcon name="Square" size={14} />
                    </Button>
                ) : (
                    <Button
                        icon
                        size="small"
                        color="norm"
                        className="shrink-0"
                        onClick={onSubmit}
                        disabled={!canSubmit}
                        aria-label={hasDraft ? c('collider_2025:Action').t`Refine` : c('collider_2025:Action').t`Draft`}
                    >
                        <LumoIcon name="ArrowUp" size={16} />
                    </Button>
                )}
            </div>
        </section>
    );
};
