import type { DraftChangeability } from '../../toolModule';
import { ADA, CHANGEABLE, composeHarness } from './compose.test.helpers';
import type { ReviseDraftParams } from './reviseDraft';
import { ReviseOutcome, createReviseDraftHandler } from './reviseDraft';

const harness = (options?: Parameters<typeof composeHarness>[0]) => {
    const { deps, references, ...recorded } = composeHarness(options);
    const revise = (params: Record<string, any>) =>
        createReviseDraftHandler(deps)(params as ReviseDraftParams, { references } as any);

    return { revise, references, ...recorded };
};

/** The one composer every case here targets, in whatever state it answers a revision with. */
const draftAnswering = (changeability: DraftChangeability) => {
    const context = harness({ changeability: { 'composer-0': changeability } });
    return { ...context, draft: context.references.referenceFor('composer', 'composer-0') };
};

const openDraft = () => draftAnswering(CHANGEABLE);

describe('revise_draft', () => {
    describe('replacing the text', () => {
        it('writes the body through to that composer', async () => {
            const { revise, draft, written } = openDraft();

            const result = await revise({ draft, body: 'Dear Mr Smith,' });

            expect(written).toEqual([{ composerID: 'composer-0', body: 'Dear Mr Smith,' }]);
            expect(result).toEqual({ outcome: ReviseOutcome.REPLACED });
        });

        it('never opens a composer', async () => {
            const { revise, draft, composed } = openDraft();

            await revise({ draft, body: 'Hello' });

            expect(composed).toEqual([]);
        });

        it('tells the model the draft has closed, which re-reading will show it', async () => {
            const { revise, draft, written } = draftAnswering({
                isOpen: false,
                isEditorReady: false,
                canReplaceBody: false,
                canReaddress: false,
            });

            await expect(revise({ draft, body: 'Dear Mr Smith,' })).rejects.toThrow('is no longer open');
            expect(written).toEqual([]);
        });

        it('tells the model to try again when the editor is still initializing', async () => {
            const { revise, draft, written } = draftAnswering({
                isOpen: true,
                isEditorReady: false,
                canReplaceBody: false,
                canReaddress: true,
            });

            await expect(revise({ draft, body: 'Dear Mr Smith,' })).rejects.toThrow('has not finished opening');
            expect(written).toEqual([]);
        });

        /**
         * A plain text reply with no signature to cut the body at, whose quote a rewrite would delete. It
         * must not read as a closed composer: read_composer reports that draft as open, so telling the
         * model to re-read leaves it looping on a call that can never succeed.
         */
        it('tells the model this draft can never be rewritten, rather than to re-read it', async () => {
            const { revise, draft, written } = draftAnswering({
                isOpen: true,
                isEditorReady: true,
                canReplaceBody: false,
                canReaddress: true,
            });

            await expect(revise({ draft, body: 'Dear Mr Smith,' })).rejects.toThrow(
                /cannot be replaced[\s\S]*do not try this call again/
            );
            expect(written).toEqual([]);
        });
    });

    describe('readdressing it', () => {
        it('changes who it is addressed to and leaves its text alone', async () => {
            const { revise, references, draft, readdressed, written, composed } = openDraft();
            const contact = references.referenceFor('contact', ADA.ID);

            const result = await revise({ draft, to: [contact] });

            expect(readdressed).toEqual([
                { composerID: 'composer-0', recipients: { ToList: [{ Name: 'Ada Lovelace', Address: ADA.Email }] } },
            ]);
            expect(written).toEqual([]);
            expect(composed).toEqual([]);
            expect(result).toEqual({ outcome: ReviseOutcome.RETARGETED });
        });

        it('names only the lists the call carries, so the others stay as the user addressed them', async () => {
            const { revise, draft, readdressed } = openDraft();

            await revise({ draft, cc: ['grace@example.com'] });

            expect(readdressed[0].recipients).toEqual({
                CCList: [{ Name: 'grace@example.com', Address: 'grace@example.com' }],
            });
        });

        it('readdresses and rewrites in the one call', async () => {
            const { revise, draft, readdressed, written } = openDraft();

            const result = await revise({ draft, to: ['grace@example.com'], body: 'Dear Grace,' });

            expect(readdressed).toHaveLength(1);
            expect(written).toEqual([{ composerID: 'composer-0', body: 'Dear Grace,' }]);
            expect(result.outcome).toBe(ReviseOutcome.RETARGETED_AND_REPLACED);
        });

        it('rejects a recipient that is neither an address nor a contact reference', async () => {
            const { revise, draft, readdressed } = openDraft();

            await expect(revise({ draft, to: ['Cristiano'] })).rejects.toThrow(
                'neither a valid email address nor a contact-… reference'
            );
            expect(readdressed).toEqual([]);
        });

        /** A draft the user opened from Drafts, whose recipient lists have not loaded yet. */
        it('tells the model a draft still opening is worth trying again, and readdresses nothing', async () => {
            const { revise, draft, readdressed } = draftAnswering({
                isOpen: true,
                isEditorReady: true,
                canReplaceBody: true,
                canReaddress: false,
            });

            await expect(revise({ draft, to: ['grace@example.com'] })).rejects.toThrow('has not finished opening');
            expect(readdressed).toEqual([]);
        });
    });

    /**
     * The dispatches a readdress makes are committed the moment they run, so a call carrying both changes
     * has to be refused whole. Half-applying it and then reporting failure leaves the draft addressed to
     * someone the user never asked for and the model saying nothing happened.
     */
    it('changes nothing at all when only part of the call could be applied', async () => {
        const { revise, draft, readdressed, written } = draftAnswering({
            isOpen: true,
            isEditorReady: true,
            canReplaceBody: false,
            canReaddress: true,
        });

        await expect(revise({ draft, to: ['grace@example.com'], body: 'Dear Grace,' })).rejects.toThrow();
        expect(readdressed).toEqual([]);
        expect(written).toEqual([]);
    });

    it('rejects a draft that is not a composer reference', async () => {
        const { revise, references } = harness();
        const email = references.referenceFor('email', 'MESSAGE_1');

        await expect(revise({ draft: email, body: 'Hello' })).rejects.toThrow('is not a composer reference');
    });

    it('rejects a call that would change nothing', async () => {
        const { revise, draft, written, readdressed } = openDraft();

        await expect(revise({ draft })).rejects.toThrow('Nothing to change');
        expect(written).toEqual([]);
        expect(readdressed).toEqual([]);
    });
});
