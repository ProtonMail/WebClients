import { c } from 'ttag';

import { localeCode } from '@proton/shared/lib/i18n';
import { getIntlLocale } from '@proton/shared/lib/i18n/helper';

import type { QuestionAnswer } from '../../../../../types';

/**
 * Render the user message composed from questions shown by the ask_user_questions tool and the user's submitted
 * selections or custom answers, including skipped questions. Display question titles and answers as styled texts.
 */
export const AskUserQuestionsResponseMessage = ({
    askUserQuestionsToolResponse,
}: {
    askUserQuestionsToolResponse: QuestionAnswer[];
}) => (
    <div className="ask-user-questions-response-message flex flex-column gap-3 w-full p-4 border radius-16 lumo-bg-panel">
        {askUserQuestionsToolResponse.map(({ questionId, title, answers, skipped }) => (
            <div key={questionId} dir="auto">
                <p className="m-0 mb-1 lumo-body-small lumo-color-glyph-mid">{title}</p>
                {skipped || !answers?.length ? (
                    <span className="lumo-color-glyph-mid">{
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
