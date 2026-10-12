import { getCreationDisplayTitle } from './creationDisplayTitle';

describe('getCreationDisplayTitle', () => {
    it('prefers artifact title from meta', () => {
        expect(
            getCreationDisplayTitle(
                'creation-abc.md',
                {
                    conversationId: 'c',
                    artifactId: 'a',
                    artifactType: 'document',
                    artifactTitle: 'Password Manager Memo',
                },
                false
            )
        ).toBe('Password Manager Memo');
    });

    it('uses real filename when meta is missing', () => {
        expect(getCreationDisplayTitle('Password Manager Memo.md', undefined, false)).toBe('Password Manager Memo');
    });

    it('hides placeholder gallery filename while loading', () => {
        expect(getCreationDisplayTitle('creation-abc.md', undefined, true)).toBe('');
    });
});
