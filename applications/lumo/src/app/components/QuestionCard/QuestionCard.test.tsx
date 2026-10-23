import { fireEvent, render, screen } from '@testing-library/react';

import { QuestionCard } from './QuestionCard';
import type { QuestionCardChoiceQuestion } from './adapters/choiceQuestionAdapter';

const questions: QuestionCardChoiceQuestion[] = [
    {
        id: 'sources',
        title: 'Which sources?',
        type: 'choice',
        allowMultiple: true,
        allowCustomAnswer: true,
        options: [
            { id: 'mail', label: 'Mail', description: 'Unread messages' },
            { id: 'news', label: 'News' },
        ],
    },
    {
        id: 'length',
        title: 'How much detail?',
        type: 'choice',
        allowCustomAnswer: true,
        options: [
            { id: 'short', label: 'Short' },
            { id: 'long', label: 'Long' },
        ],
    },
];

const renderCard = (questionSet = questions) => {
    const onSubmit = jest.fn();
    const onDismiss = jest.fn();
    return {
        ...render(<QuestionCard questions={questionSet} onSubmit={onSubmit} onDismiss={onDismiss} />),
        onSubmit,
        onDismiss,
    };
};

const clickButton = (name: string) => fireEvent.click(screen.getByRole('button', { name }));
const enterCustomAnswer = (value: string) =>
    fireEvent.change(screen.getByRole('textbox', { name: 'Your answer' }), { target: { value } });

const skipped = (questionId: string) => ({ questionId, selections: [] as string[] });

describe('QuestionCard', () => {
    it('renders nothing for an empty question set', () => {
        const { container, onSubmit } = renderCard([]);
        expect(container).toBeEmptyDOMElement();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('shows Submit without a stepper for one question and allows submitting it unanswered', () => {
        const { onSubmit } = renderCard([questions[0]]);
        expect(screen.queryByRole('button', { name: 'Previous question' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Next question' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Continue to next question' })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled();
        clickButton('Submit');
        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(onSubmit).toHaveBeenCalledWith([skipped('sources')]);
    });

    it('associates the controls with the question and their accessible descriptions', () => {
        renderCard();
        expect(screen.getByRole('region', { name: questions[0].title })).toBeInTheDocument();
        expect(screen.getByRole('group', { name: questions[0].title })).toHaveAccessibleDescription();
        expect(screen.getByRole('checkbox', { name: 'Mail' })).toHaveAccessibleDescription();
        expect(screen.getByRole('textbox', { name: 'Your answer' })).toHaveValue('');
        expect(screen.getByRole('checkbox', { name: 'Your answer' })).not.toBeChecked();
    });

    it('uses radio buttons by default and hides the custom field when custom answers are disabled', () => {
        renderCard([{ ...questions[1], allowCustomAnswer: false }]);
        expect(screen.getAllByRole('radio')).toHaveLength(2);
        expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('preserves answers across both navigation directions and submits in question order', () => {
        const { onSubmit } = renderCard();
        expect(screen.getByRole('button', { name: 'Previous question' })).toBeDisabled();
        fireEvent.click(screen.getByRole('checkbox', { name: 'Mail' }));
        fireEvent.click(screen.getByRole('checkbox', { name: 'News' }));
        clickButton('Continue to next question');
        expect(screen.getByRole('heading', { name: 'How much detail?' })).toHaveFocus();
        expect(screen.getByRole('button', { name: 'Next question' })).toBeDisabled();
        fireEvent.click(screen.getByRole('radio', { name: 'Short' }));
        fireEvent.click(screen.getByRole('radio', { name: 'Long' }));
        expect(screen.getByRole('radio', { name: 'Short' })).not.toBeChecked();
        clickButton('Previous question');
        expect(screen.getByRole('checkbox', { name: 'Mail' })).toBeChecked();
        expect(screen.getByRole('checkbox', { name: 'News' })).toBeChecked();
        clickButton('Next question');
        expect(screen.getByRole('radio', { name: 'Long' })).toBeChecked();
        clickButton('Submit');
        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(onSubmit).toHaveBeenCalledWith([
            { questionId: 'sources', selections: ['Mail', 'News'] },
            { questionId: 'length', selections: ['Long'] },
        ]);
    });

    it.each(['Next question', 'Continue to next question'])(
        'marks an unanswered question skipped when leaving through %s',
        (button) => {
            const { onSubmit } = renderCard();
            expect(screen.getByRole('button', { name: button })).toBeEnabled();
            clickButton(button);
            expect(onSubmit).not.toHaveBeenCalled();
            clickButton('Previous question');
            expect(screen.getByRole('checkbox', { name: 'Mail' })).not.toBeChecked();
            clickButton('Next question');
            fireEvent.click(screen.getByRole('radio', { name: 'Short' }));
            clickButton('Submit');
            expect(onSubmit).toHaveBeenCalledWith([
                skipped('sources'),
                { questionId: 'length', selections: ['Short'] },
            ]);
        }
    );

    it('clears an incomplete answer when navigating backward and submits it as skipped', () => {
        const { onSubmit } = renderCard();
        fireEvent.click(screen.getByRole('checkbox', { name: 'Mail' }));
        clickButton('Next question');
        enterCustomAnswer('   ');
        clickButton('Previous question');
        expect(screen.getByRole('checkbox', { name: 'Mail' })).toBeChecked();
        clickButton('Next question');
        expect(screen.getByRole('textbox')).toHaveValue('');
        expect(screen.getByRole('radio', { name: 'Your answer' })).not.toBeChecked();
        clickButton('Submit');
        expect(onSubmit).toHaveBeenCalledWith([{ questionId: 'sources', selections: ['Mail'] }, skipped('length')]);
    });

    it('clears incomplete drafts when navigating away instead of submitting their partial values', () => {
        const { onSubmit } = renderCard();
        enterCustomAnswer('   ');
        clickButton('Next question');
        clickButton('Previous question');
        expect(screen.getByRole('checkbox', { name: 'Mail' })).not.toBeChecked();
        expect(screen.getByRole('checkbox', { name: 'Your answer' })).not.toBeChecked();
        expect(screen.getByRole('textbox')).toHaveValue('');
        clickButton('Next question');
        clickButton('Submit');
        expect(onSubmit).toHaveBeenCalledWith([skipped('sources'), skipped('length')]);
    });

    it('submits the entire set as skipped when no questions are answered', () => {
        const { onSubmit } = renderCard();
        clickButton('Next question');
        expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled();
        clickButton('Submit');
        expect(onSubmit).toHaveBeenCalledWith([skipped('sources'), skipped('length')]);
    });

    it('preserves an earlier valid answer when the final question is unanswered', () => {
        const { onSubmit } = renderCard();
        fireEvent.click(screen.getByRole('checkbox', { name: 'Mail' }));
        clickButton('Continue to next question');
        clickButton('Submit');
        expect(onSubmit).toHaveBeenCalledWith([{ questionId: 'sources', selections: ['Mail'] }, skipped('length')]);
    });

    it('treats an incomplete final custom answer as skipped', () => {
        const { onSubmit } = renderCard();
        clickButton('Next question');
        enterCustomAnswer('   ');
        expect(screen.getByRole('radio', { name: 'Your answer' })).toBeChecked();
        clickButton('Submit');
        expect(onSubmit).toHaveBeenCalledWith([skipped('sources'), skipped('length')]);
    });

    it('lets the user replace a skipped question with an answer', () => {
        const { onSubmit } = renderCard();
        clickButton('Skip');
        clickButton('Previous question');
        fireEvent.click(screen.getByRole('checkbox', { name: 'Mail' }));
        clickButton('Next question');
        clickButton('Submit');
        expect(onSubmit).toHaveBeenCalledWith([{ questionId: 'sources', selections: ['Mail'] }, skipped('length')]);
    });

    it('explicit Skip discards even a valid answer and clears the controls on revisit', () => {
        const { onSubmit } = renderCard();
        fireEvent.click(screen.getByRole('checkbox', { name: 'Mail' }));
        enterCustomAnswer('Meeting notes');
        clickButton('Skip');
        clickButton('Previous question');
        expect(screen.getByRole('checkbox', { name: 'Mail' })).not.toBeChecked();
        expect(screen.getByRole('textbox')).toHaveValue('');
        clickButton('Next question');
        clickButton('Skip');
        expect(onSubmit).toHaveBeenCalledWith([skipped('sources'), skipped('length')]);
    });

    it('trims selected custom text while preserving multiple selected options', () => {
        const { onSubmit } = renderCard([questions[0]]);
        fireEvent.click(screen.getByRole('checkbox', { name: 'Mail' }));
        fireEvent.click(screen.getByRole('checkbox', { name: 'News' }));
        enterCustomAnswer('  Meeting notes  ');
        expect(screen.getByRole('checkbox', { name: 'Your answer' })).toBeChecked();
        clickButton('Submit');
        expect(onSubmit).toHaveBeenCalledWith([
            {
                questionId: 'sources',
                selections: ['Mail', 'News', 'Meeting notes'],
            },
        ]);
    });

    it('submits a custom-only answer with no selected option ids', () => {
        const { onSubmit } = renderCard([questions[0]]);
        enterCustomAnswer('  A different source  ');
        clickButton('Submit');
        expect(onSubmit).toHaveBeenCalledWith([{ questionId: 'sources', selections: ['A different source'] }]);
    });

    it('omits custom text when its checkbox is deselected without deleting the draft text', () => {
        const { onSubmit } = renderCard([questions[0]]);
        fireEvent.click(screen.getByRole('checkbox', { name: 'Mail' }));
        enterCustomAnswer('Meeting notes');
        fireEvent.click(screen.getByRole('checkbox', { name: 'Your answer' }));
        expect(screen.getByRole('checkbox', { name: 'Your answer' })).not.toBeChecked();
        expect(screen.getByRole('textbox')).toHaveValue('Meeting notes');
        clickButton('Submit');
        expect(onSubmit).toHaveBeenCalledWith([{ questionId: 'sources', selections: ['Mail'] }]);
    });

    it('deselects individual multiple-choice options', () => {
        const { onSubmit } = renderCard([questions[0]]);
        fireEvent.click(screen.getByRole('checkbox', { name: 'Mail' }));
        fireEvent.click(screen.getByRole('checkbox', { name: 'News' }));
        fireEvent.click(screen.getByRole('checkbox', { name: 'Mail' }));
        expect(screen.getByRole('checkbox', { name: 'Mail' })).not.toBeChecked();
        expect(screen.getByRole('checkbox', { name: 'News' })).toBeChecked();
        clickButton('Submit');
        expect(onSubmit).toHaveBeenCalledWith([{ questionId: 'sources', selections: ['News'] }]);
    });

    it('keeps custom text exclusive in single selection and omits it after selecting a listed option', () => {
        const { onSubmit } = renderCard([questions[1]]);
        fireEvent.click(screen.getByRole('radio', { name: 'Short' }));
        enterCustomAnswer('Medium');
        expect(screen.getByRole('radio', { name: 'Short' })).not.toBeChecked();
        expect(screen.getByRole('radio', { name: 'Your answer' })).toBeChecked();
        fireEvent.click(screen.getByRole('radio', { name: 'Long' }));
        expect(screen.getByRole('textbox')).toHaveValue('Medium');
        expect(screen.getByRole('radio', { name: 'Your answer' })).not.toBeChecked();
        clickButton('Submit');
        expect(onSubmit).toHaveBeenCalledWith([{ questionId: 'length', selections: ['Long'] }]);
    });

    it.each([0, 1])('dismisses from question index %i without submitting', (index) => {
        const { onSubmit, onDismiss } = renderCard();
        fireEvent.click(screen.getByRole('checkbox', { name: 'Mail' }));
        if (index === 1) clickButton('Next question');
        clickButton('Dismiss questions');
        expect(onDismiss).toHaveBeenCalledTimes(1);
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('keeps navigation within the first and last questions without submitting', () => {
        const { onSubmit, onDismiss } = renderCard();
        clickButton('Previous question');
        expect(screen.getByRole('heading', { name: questions[0].title })).toBeInTheDocument();
        clickButton('Next question');
        expect(screen.getByRole('heading', { name: questions[1].title })).toHaveFocus();
        clickButton('Next question');
        expect(screen.getByRole('heading', { name: questions[1].title })).toBeInTheDocument();
        clickButton('Previous question');
        expect(screen.getByRole('heading', { name: questions[0].title })).toHaveFocus();
        expect(onSubmit).not.toHaveBeenCalled();
        expect(onDismiss).not.toHaveBeenCalled();
    });

    it('submits the latest edits to earlier answers while preserving later answers', () => {
        const { onSubmit, onDismiss } = renderCard();
        fireEvent.click(screen.getByRole('checkbox', { name: 'Mail' }));
        clickButton('Next question');
        fireEvent.click(screen.getByRole('radio', { name: 'Short' }));
        clickButton('Previous question');
        fireEvent.click(screen.getByRole('checkbox', { name: 'Mail' }));
        enterCustomAnswer('Updated source');
        clickButton('Continue to next question');
        expect(screen.getByRole('radio', { name: 'Short' })).toBeChecked();
        clickButton('Submit');
        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(onSubmit).toHaveBeenCalledWith([
            { questionId: 'sources', selections: ['Updated source'] },
            { questionId: 'length', selections: ['Short'] },
        ]);
        expect(onDismiss).not.toHaveBeenCalled();
    });

    it('discards a valid final answer on Skip while keeping earlier answers', () => {
        const { onSubmit } = renderCard();
        fireEvent.click(screen.getByRole('checkbox', { name: 'Mail' }));
        clickButton('Next question');
        fireEvent.click(screen.getByRole('radio', { name: 'Short' }));
        enterCustomAnswer('Custom length');
        clickButton('Skip');
        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(onSubmit).toHaveBeenCalledWith([{ questionId: 'sources', selections: ['Mail'] }, skipped('length')]);
    });

    it('submits a cleared answer as skipped after deselecting all options', () => {
        const { onSubmit } = renderCard([questions[0]]);
        fireEvent.click(screen.getByRole('checkbox', { name: 'Mail' }));
        fireEvent.click(screen.getByRole('checkbox', { name: 'Mail' }));
        clickButton('Submit');
        expect(onSubmit).toHaveBeenCalledWith([skipped('sources')]);
    });

    it.each([
        { question: questions[0], role: 'checkbox' },
        { question: questions[1], role: 'radio' },
    ])('restores a custom answer when reselecting its $role', ({ question, role }) => {
        const { onSubmit } = renderCard([question]);
        enterCustomAnswer('Custom answer');
        fireEvent.click(screen.getByRole(role, { name: question.options[0].label }));
        if (question.allowMultiple) {
            fireEvent.click(screen.getByRole(role, { name: 'Your answer' }));
        }
        expect(screen.getByRole(role, { name: 'Your answer' })).not.toBeChecked();
        fireEvent.click(screen.getByRole(role, { name: 'Your answer' }));
        expect(screen.getByRole('textbox')).toHaveValue('Custom answer');
        expect(screen.getByRole(role, { name: 'Your answer' })).toBeChecked();
        clickButton('Submit');
        expect(onSubmit).toHaveBeenCalledWith([
            {
                questionId: question.id,
                selections: question.allowMultiple ? [question.options[0].label, 'Custom answer'] : ['Custom answer'],
            },
        ]);
    });
});
