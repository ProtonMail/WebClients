import { c } from 'ttag';

import { localeCode } from '@proton/shared/lib/i18n';
import { getIntlLocale } from '@proton/shared/lib/i18n/helper';

import type { QuestionAnswer } from '../../../../../types';

import './AskUserQuestionsResponseMessage.scss';

/**
 * Render the user message composed from questions shown by the ask_user_questions tool and the user's submitted
 * selections or custom answers, including skipped questions. Display question titles and answers as styled texts.
 */
export const AskUserQuestionsResponseMessage = ({ questionAnswers }: { questionAnswers: QuestionAnswer[] }) => (
    <div className="ask-user-questions-response-message flex flex-column gap-3 w-full p-4 border border-weak rounded-xl bg-norm">
        {questionAnswers.map(({ questionId, title, answers, skipped }) => (
            <div key={questionId}>
                <p className="m-0 mb-1 text-sm color-weak">{title}</p>
                {skipped || !answers?.length ? (
                    <span className="color-hint">{
                        // translator: Indicates that the user left a question unanswered in their submitted response.
                        c('collider_2025:Info').t`Skipped`
                    }</span>
                ) : (
                    <p className="m-0">
                        {new Intl.ListFormat(getIntlLocale(localeCode), { type: 'unit' }).format(answers)}
                    </p>
                )}
            </div>
        ))}
    </div>
);
