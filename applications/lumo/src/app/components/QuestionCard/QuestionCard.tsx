import { useEffect, useId, useRef, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Scroll } from '@proton/atoms/Scroll/Scroll';

import { LumoIcon } from '../LumoIcon/LumoIcon';
import { QuestionCardStepper } from './QuestionCardStepper';
import { getQuestionAdapter } from './adapters/questionAdapter';
import type { QuestionCardAnswerData, QuestionCardDraftData, QuestionCardQuestionData } from './types';

import './QuestionCard.scss';

interface QuestionCardProps {
    questions: QuestionCardQuestionData[];
    onSubmit: (answers: QuestionCardAnswerData[]) => void;
}

export const QuestionCard = ({ questions, onSubmit }: QuestionCardProps) => {
    const id = useId();
    const titleRef = useRef<HTMLHeadingElement>(null);
    const showQuestionsRef = useRef<HTMLButtonElement>(null);
    const [isMinimized, setIsMinimized] = useState(false);
    const [index, setIndex] = useState(0);
    const [drafts, setDrafts] = useState<Record<string, QuestionCardDraftData>>({});
    const question = questions[index];

    useEffect(() => {
        // Keep focus in the card when switching questions or minimizing and reopening it.
        (isMinimized ? showQuestionsRef.current : titleRef.current)?.focus();
    }, [index, isMinimized]);

    if (!question) return null;

    if (isMinimized) {
        return (
            <section
                aria-labelledby={`${id}-title`}
                className="question-card border question-card--minimized flex flex-nowrap items-center w-full p-2 pl-4 rounded-xl bg-norm"
            >
                <LumoIcon
                    aria-hidden="true"
                    className="shrink-0 mr-2 lumo-color-glyph-brand-text"
                    name="ClipboardPen"
                    size={14}
                    strokeWidth={1.4}
                />
                <span className="text-ellipsis">
                    <span className="mr-2 lumo-body-small">
                        {
                            // translator: Status on a minimized card. The wording depends on how many questions the card contains.
                            c('collider_2025:Status').ngettext(
                                msgid`Waiting for your answer…`,
                                `Waiting for your answers…`,
                                questions.length
                            )
                        }
                    </span>
                    <span
                        id={`${id}-title`}
                        className="flex-1 min-w-0 mr-3 lumo-body-medium lumo-color-glyph-mid"
                        dir="auto"
                        title={question.title}
                    >
                        {question.title}
                    </span>
                </span>
                <Button
                    ref={showQuestionsRef}
                    className="shrink-0 ml-auto"
                    shape="ghost"
                    size="tiny"
                    type="button"
                    onClick={() => setIsMinimized(false)}
                >
                    {
                        // translator: Button to reopen a minimized card. The label depends on how many questions the card contains.
                        c('collider_2025:Action').ngettext(msgid`Show question`, `Show questions`, questions.length)
                    }
                </Button>
            </section>
        );
    }

    const adapter = getQuestionAdapter(question);
    const draft = drafts[question.id] ?? adapter.createInitialDraft();
    const isLast = index === questions.length - 1;

    const getUpdatedDrafts = (skip = false) => ({
        ...drafts,
        // Explicit skips and unanswered navigation both reset the question for a later visit.
        [question.id]: skip || !adapter.isAnswered(draft) ? adapter.createInitialDraft() : draft,
    });

    const navigate = (nextIndex: number) => {
        setDrafts(getUpdatedDrafts());
        setIndex(nextIndex);
    };

    const advance = (skip: boolean) => {
        const nextDrafts = getUpdatedDrafts(skip);
        setDrafts(nextDrafts);

        if (isLast) {
            // Complete the set in question order, treating missing or incomplete drafts as skipped.
            onSubmit(
                questions.map((item): QuestionCardAnswerData => {
                    const adapter = getQuestionAdapter(item);
                    const draft = nextDrafts[item.id];
                    return adapter.toAnswer(draft && adapter.isAnswered(draft) ? draft : adapter.createInitialDraft());
                })
            );
        } else {
            setIndex(index + 1);
        }
    };

    return (
        <section
            aria-labelledby={`${id}-title`}
            className="question-card border flex flex-column flex-nowrap w-full radius-16 lumo-bg-panel"
        >
            {/* Header */}
            <div className="flex flex-nowrap items-start gap-3 p-4 pb-2 pl-5">
                <h3
                    ref={titleRef}
                    dir="auto"
                    className="question-card__title flex-1 min-w-0 m-0 lumo-title-small"
                    id={`${id}-title`}
                    tabIndex={-1}
                    style={{
                        textAlign: document.dir === 'rtl' ? 'right' : 'left',
                    }}
                >
                    {question.title}
                </h3>
                <div className="flex flex-nowrap items-center gap-3">
                    <QuestionCardStepper
                        currentIndex={index}
                        total={questions.length}
                        onNext={() => navigate(index + 1)}
                        onPrevious={() => navigate(index - 1)}
                    />
                    <Button
                        // translator: Button to minimize the question card while keeping draft answers.
                        aria-label={c('collider_2025:Action').t`Minimize questions`}
                        className="p-0 lumo-color-glyph-mid"
                        icon
                        shape="ghost"
                        size="small"
                        type="button"
                        onClick={() => setIsMinimized(true)}
                    >
                        <LumoIcon aria-hidden="true" name="X" size={16} strokeWidth={1.4} />
                    </Button>
                </div>
            </div>

            {/* Question body */}
            <Scroll className="question-card__body flex flex-column flex-nowrap overflow-hidden" scrollContained>
                {adapter.renderBody({
                    idPrefix: id,
                    titleId: `${id}-title`,
                    value: draft,
                    onChange: (value: QuestionCardDraftData) => {
                        setDrafts((previous) => ({ ...previous, [question.id]: value }));
                    },
                })}
            </Scroll>

            {/* Footer */}
            <div className="flex flex-nowrap items-center gap-2 p-3 pl-5 border-top lumo-border">
                <span aria-atomic="true" aria-live="polite" className="flex-1 lumo-body-small lumo-color-glyph-mid">
                    {adapter.renderStatus(draft)}
                </span>
                <Button size="small" type="button" onClick={() => advance(true)}>
                    {
                        // translator: Button to skip the current question and continue.
                        c('collider_2025:Action').t`Skip`
                    }
                </Button>
                <Button
                    // translator: Button to keep the current answer and move to the next question.
                    aria-label={isLast ? undefined : c('collider_2025:Action').t`Continue to next question`}
                    color="norm"
                    icon={!isLast}
                    size="small"
                    type="button"
                    onClick={() => advance(false)}
                >
                    {isLast ? (
                        <>
                            {
                                // translator: Button to submit answers to the entire question set.
                                c('collider_2025:Action').t`Submit`
                            }
                        </>
                    ) : (
                        <LumoIcon aria-hidden="true" name="ArrowRight" size={16} strokeWidth={1.4} />
                    )}
                </Button>
            </div>
        </section>
    );
};
