import type { ProtonPluginSkill } from './types';

export const LEARNING_SKILLS: ProtonPluginSkill[] = [
    {
        name: 'explain',
        description:
            'Explain a concept at the right level, with an analogy, an example and a quick check of understanding. Use for "explain…", "what is…", "I don\'t get…", or "ELI5".',
        instructions: `# Explain

Make an idea click, at the level the user needs.

## Steps

1. Gauge the level from how the user asks. If it's unclear and matters, ask whether they want the beginner, intermediate or expert version.
2. **Start with the core idea** in one or two plain sentences.
3. **Make it concrete** with an analogy from everyday life and one worked example.
4. **Add depth in layers:** how it works, why it matters, and common misconceptions. Stop when the question is answered.
5. **Check understanding** with one short question, or offer a quick quiz.

## Rules

- Define every technical term the first time you use it.
- Say when an analogy breaks down.
- Use a chart or diagram, or offer an interactive explainer, when the idea is visual or numeric.`,
    },
    {
        name: 'quiz-me',
        description:
            'Quiz the user on a topic or their own notes with interactive multiple-choice questions, scoring and explanations. Use for "quiz me on…", "test my knowledge", or revising for an exam.',
        instructions: `# Quiz me

Active recall, one round at a time.

## Steps

1. Confirm the topic or source material, the level, and how many questions (default five).
2. Ask the questions as a question card, single choice with four options, one round of up to five questions at a time.
3. When the answers come back, give the score, explain each wrong answer briefly (why the right one is right), and note patterns in the mistakes.
4. Offer the next round, focusing on what they got wrong, or a harder level if they did well.

## Rules

- Write questions that test understanding, not trivia or trick wording.
- Make the wrong options plausible.
- When quizzing on the user's notes, use only their material.`,
    },
    {
        name: 'study-plan',
        description:
            'Build a study or learning plan toward a goal or exam date, with weekly milestones, resources and review sessions. Use for "help me learn…", "I have an exam in…", or "make me a study plan".',
        instructions: `# Study plan

A plan that fits the time available and builds in review.

## Steps

1. Ask for the goal, deadline, current level, and hours available per week, with a question card if they weren't given.
2. Break the subject into topics in a sensible order, prerequisites first.
3. Lay out a week-by-week plan as a table: topics, activities (learn, practice, review), and a milestone for each week. Use spaced repetition: revisit topics a few days and a couple of weeks after first learning them.
4. Suggest a few good free resources per topic, found with a web search and with links.
5. Offer a scheduled task for weekly check-ins or daily practice prompts.

## Rules

- Be realistic about time. If the goal doesn't fit, say what to cut or how much more time it needs.
- Plan practice and self-testing, not just reading.`,
    },
    {
        name: 'flashcards',
        description:
            'Turn notes, a chapter or a topic into flashcards, as a printable list or an interactive flip-card page. Use for "make flashcards", "help me memorize…", or vocabulary practice.',
        instructions: `# Flashcards

Cards that are quick to review and actually stick.

## Steps

1. Pull out the key facts, terms and concepts from the user's material or the topic.
2. Write one fact per card: a short, specific question on the front and a short answer on the back. Add an example for vocabulary.
3. Deliver the cards as a two-column table (front, back) by default.
4. Offer an interactive version: a web page in the canvas with flip cards, shuffle, and "got it" or "again" buttons that keep score. It must be one self-contained HTML file with no external resources.

## Rules

- No yes-or-no questions, and no cards that pack in several facts.
- Keep the user's terminology and language.
- Aim for 10 to 30 cards per set; offer more in a second batch.`,
    },
];
