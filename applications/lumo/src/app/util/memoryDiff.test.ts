import type { Memory } from '../redux/slices/lumoUserSettings';
import { diffWords, groupMemoryChanges } from './memoryDiff';

const memory = (id: string, content: string): Memory => ({ id, content, createdAt: 0, source: 'generated' }) as Memory;

describe('diffWords', () => {
    it('marks only the dropped word on the old side', () => {
        const { before, after } = diffWords(
            'Follows Newcastle United football club closely',
            'Follows Newcastle United closely'
        );

        expect(before.filter((s) => s.type === 'removed').map((s) => s.text)).toEqual(['football club']);
        expect(after.every((s) => s.type === 'same')).toBe(true);
    });

    it('keeps meaningful punctuation so C++ and C# are different tokens', () => {
        const { before, after } = diffWords('Uses C++ at work', 'Uses C# at work');

        expect(before.filter((s) => s.type === 'removed').map((s) => s.text)).toEqual(['C++']);
        expect(after.filter((s) => s.type === 'added').map((s) => s.text)).toEqual(['C#']);
    });

    it('ignores trailing sentence punctuation', () => {
        const { before, after } = diffWords('Likes tea.', 'Likes tea');

        expect(before.every((s) => s.type === 'same')).toBe(true);
        expect(after.every((s) => s.type === 'same')).toBe(true);
    });

    it('marks inserted words on the new side', () => {
        const { before, after } = diffWords('Likes tea', 'Likes green tea');

        expect(before.every((s) => s.type === 'same')).toBe(true);
        expect(after.filter((s) => s.type === 'added').map((s) => s.text)).toEqual(['green']);
    });
});

describe('groupMemoryChanges', () => {
    it('pairs a reworded memory with its replacement', () => {
        const old = memory('1', 'Follows Newcastle United football club closely');
        const next = memory('2', 'Follows Newcastle United closely');

        expect(groupMemoryChanges([old], [next])).toEqual([{ before: [old], after: next }]);
    });

    it('groups merged memories under one replacement', () => {
        const a = memory('1', 'Uses TypeScript for work projects');
        const b = memory('2', 'Uses TypeScript for side projects');
        const merged = memory('3', 'Uses TypeScript for work and side projects');

        expect(groupMemoryChanges([a, b], [merged])).toEqual([{ before: [a, b], after: merged }]);
    });

    it('keeps unrelated memories as separate removed and new entries', () => {
        const old = memory('1', 'Lives in Geneva');
        const next = memory('2', 'Prefers concise answers');

        expect(groupMemoryChanges([old], [next])).toEqual([
            { before: [old], after: null },
            { before: [], after: next },
        ]);
    });
});
