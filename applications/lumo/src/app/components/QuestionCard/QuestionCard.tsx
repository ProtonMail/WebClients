import { useEffect, useId, useRef, useState } from 'react';

import { c } from 'ttag';

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
    onDismiss: () => void;
}

export const QuestionCard = ({ questions, onSubmit, onDismiss }: QuestionCardProps) => {
    const id = useId();
    const titleRef = useRef<HTMLHeadingElement>(null);
    const [index, setIndex] = useState(0);
    const [drafts, setDrafts] = useState<Record<string, QuestionCardDraftData>>({});
    const question = questions[index];

    useEffect(() => {
        // Intentionally focus the title on mount to request an answer and announce the question.
        // Repeat after navigation so keyboard and screen-reader users follow the active question.
        titleRef.current?.focus();
    }, [index]);

    if (!question) return null;

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
            className="question-card flex flex-column flex-nowrap w-full rounded-xl bg-norm"
        >
            {/* Header */}
            <div className="flex flex-nowrap items-start gap-3 p-4 pb-2 pl-5">
                <h3
                    ref={titleRef}
                    className="question-card__title flex-1 min-w-0 m-0 text-rg text-semibold"
                    id={`${id}-title`}
                    tabIndex={-1}
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
                        // translator: Button to close the entire set of questions without submitting answers.
                        aria-label={c('collider_2025:Action').t`Dismiss questions`}
                        className="p-0 color-weak"
                        icon
                        shape="ghost"
                        size="small"
                        type="button"
                        onClick={onDismiss}
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
            <div className="flex flex-nowrap items-center gap-2 p-3 pl-5 border-top border-weak">
                <span aria-atomic="true" aria-live="polite" className="flex-1 text-xs color-hint">
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
