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

    it('builds a deck edit prompt that names each selected field and keeps the deck rules', () => {
        const prompt = buildArtifactActionLlmPrompt({
            kind: 'edit',
            artifactId: 'q3-review',
            artifactTitle: 'Q3 Review',
            artifactType: 'presentation',
            selection: 'rose from 41 to 47',
            userInstruction: 'say it rose by 6 points',
            deckSelection: [
                { slide: 2, field: 'title', text: 'Highlights', selected: 'Highlights' },
                {
                    slide: 2,
                    field: 'bullet',
                    bullet: 3,
                    text: 'Customer satisfaction (NPS) rose from 41 to 47',
                    selected: 'rose from 41 to 47',
                },
            ],
        });

        expect(prompt).toContain('slide deck artifact (id: q3-review)');
        expect(prompt).toContain('- slide 2, title: "Highlights"\n');
        expect(prompt).toContain(
            '- slide 2, bullet 3: "Customer satisfaction (NPS) rose from 41 to 47" (selected: "rose from 41 to 47")'
        );
        expect(prompt).toContain('Change: say it rose by 6 points');
        expect(prompt).toContain('keep every other slide as it is');
        expect(prompt).toContain('never invent numbers');
    });

    it('asks for the missing data to replace "missing" only when a "Data needed" box is selected', () => {
        const meta: ArtifactActionMeta = {
            kind: 'edit',
            artifactId: 'pitch',
            artifactTitle: 'Pitch',
            artifactType: 'presentation',
            selection: 'market size figures',
            userInstruction: 'EU 2.1bn, US 3.4bn',
            deckSelection: [
                { slide: 3, field: 'missingData', text: 'market size figures', selected: 'market size figures' },
            ],
        };

        const prompt = buildArtifactActionLlmPrompt(meta);

        expect(prompt).toContain('- slide 3, chart marked as missing, with "missing": "market size figures"');
        expect(prompt).toContain('replace "missing" with the chart\'s data');
        expect(
            buildArtifactActionLlmPrompt({
                ...meta,
                deckSelection: [{ slide: 3, field: 'title', text: 'Market', selected: 'Market' }],
            })
        ).not.toContain('replace "missing"');
    });

    it('names the column and the quote fields of the deck', () => {
        const prompt = buildArtifactActionLlmPrompt({
            kind: 'edit',
            artifactId: 'q3-review',
            artifactTitle: 'Q3 Review',
            artifactType: 'presentation',
            selection: 'Faster',
            userInstruction: 'reword',
            deckSelection: [
                { slide: 3, field: 'right', bullet: 2, text: 'Faster checkout', selected: 'Faster' },
                { slide: 4, field: 'quote', text: 'It just works', selected: 'It just works' },
                { slide: 4, field: 'attribution', text: 'A customer', selected: 'A customer' },
            ],
        });

        expect(prompt).toContain('- slide 3, right column, bullet 2: "Faster checkout" (selected: "Faster")');
        expect(prompt).toContain('- slide 4, quote: "It just works"');
        expect(prompt).toContain('- slide 4, attribution: "A customer"');
    });
});
