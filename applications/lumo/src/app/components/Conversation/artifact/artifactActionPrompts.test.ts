import type { ArtifactActionMeta } from '../../../types';
import {
    buildArtifactActionLlmPrompt,
    getArtifactActionDisplayContent,
    getArtifactActionLabel,
} from './artifactActionPrompts';

describe('artifactActionPrompts', () => {
    const baseMeta: ArtifactActionMeta = {
        kind: 'explain',
        artifactId: 'hello-script',
        artifactTitle: 'Hello Script',
        artifactType: 'code',
        selection: 'print("hi")',
    };

    it('builds an explain prompt with artifact id and selection', () => {
        const prompt = buildArtifactActionLlmPrompt(baseMeta);

        expect(prompt).toContain('Explain this selected part');
        expect(prompt).toContain('Hello Script');
        expect(prompt).toContain('hello-script');
        expect(prompt).toContain('print("hi")');
    });

    it('builds an improve prompt', () => {
        const prompt = buildArtifactActionLlmPrompt({
            ...baseMeta,
            kind: 'improve',
        });

        expect(prompt).toContain('Improve this selected part');
        expect(prompt).toContain('with improved code');
    });

    it('builds an edit prompt with user instruction', () => {
        const prompt = buildArtifactActionLlmPrompt({
            kind: 'edit',
            artifactId: 'cover-letter',
            artifactTitle: 'Cover Letter',
            artifactType: 'document',
            selection: 'Dear hiring manager,',
            userInstruction: 'make it shorter',
        });

        expect(prompt).toContain('Edit the "Cover Letter" artifact');
        expect(prompt).toContain('make it shorter');
    });

    it('returns display content for chat previews', () => {
        expect(getArtifactActionDisplayContent(baseMeta)).toContain('Hello Script');
        expect(getArtifactActionLabel('explain')).toBeTruthy();
    });
});
