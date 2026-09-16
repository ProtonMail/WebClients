import type { ActionRequest, ReferenceLabels } from '@proton/llm/lib/lumoAgent/contracts/types';
import { createReferenceRegistry } from '@proton/llm/lib/lumoAgent/engine/referenceRegistry';
import sentenceText from '@proton/llm/lib/lumoAgent/ui/sentenceText';
import { LABEL_TYPE } from '@proton/shared/lib/constants';
import type { Label } from '@proton/shared/lib/interfaces';

import type { MailToolDeps } from '../../toolModule';
import { createRenameLabelHandler, renameLabelDefinition, renameLabelModule } from './renameLabel';

const label = (overrides: Partial<Label> = {}): Label => ({
    ID: 'LABEL_ID_1',
    Name: 'Work',
    Color: '#cf3a6e',
    Path: 'Work',
    Type: LABEL_TYPE.MESSAGE_LABEL,
    Order: 1,
    LastUnseenMessageEventID: null,
    ...overrides,
});

const setUp = (labels: Label[]) => {
    const references = createReferenceRegistry();
    const labelReference = references.referenceFor('label', 'LABEL_ID_1', { title: 'Work' });
    const updateLabel = jest.fn().mockResolvedValue(undefined);
    const deps = { getLabels: () => labels, updateLabel } as unknown as MailToolDeps;

    return { references, labelReference, updateLabel, deps };
};

describe('renameLabelDefinition', () => {
    it('exempts the new name from the reference guard, leaving the label itself guarded', () => {
        const guarded = Object.keys(renameLabelDefinition.paramsSchema.properties).filter(
            (param) => !renameLabelDefinition.freeTextParams?.includes(param)
        );

        expect(guarded).toEqual(['label']);
    });
});

describe('renameLabelCardRenderer', () => {
    const sentence = (action: ActionRequest, labels: ReferenceLabels) =>
        sentenceText(renameLabelModule.cardRenderer!.sentence(action, labels));

    it('names the label, or says "this label" when no name was recorded', () => {
        const action = { type: 'rename_label', label: 'label-m3n4p5', name: '' } as ActionRequest;

        expect(sentence(action, { 'label-m3n4p5': { title: 'Work' } })).toContain('Work');
        expect(sentence(action, {})).toBe('Rename this label');
        expect(sentence({ type: 'rename_label' } as ActionRequest, {})).toBe('Rename this label');
    });
});

describe('createRenameLabelHandler', () => {
    it('renames a label, preserving every field it does not change', async () => {
        const existing = label();
        const { references, labelReference, updateLabel, deps } = setUp([existing]);

        await createRenameLabelHandler(deps)({ label: labelReference, name: 'Projects' }, { references });

        expect(updateLabel).toHaveBeenCalledWith({ labelID: 'LABEL_ID_1', label: { ...existing, Name: 'Projects' } });
    });

    it('trims a name the user padded on the card', async () => {
        const { references, labelReference, updateLabel, deps } = setUp([label()]);

        await createRenameLabelHandler(deps)({ label: labelReference, name: '  Projects  ' }, { references });

        expect(updateLabel).toHaveBeenCalledWith(
            expect.objectContaining({ label: expect.objectContaining({ Name: 'Projects' }) })
        );
    });

    it('reports a label that no longer exists, rather than renaming nothing', async () => {
        const { references, labelReference, updateLabel, deps } = setUp([]);

        await expect(
            createRenameLabelHandler(deps)({ label: labelReference, name: 'Projects' }, { references })
        ).rejects.toThrow(/no longer exists/);
        expect(updateLabel).not.toHaveBeenCalled();
    });

    it('refuses when the label already has the requested name', async () => {
        const { references, labelReference, updateLabel, deps } = setUp([label()]);

        await expect(
            createRenameLabelHandler(deps)({ label: labelReference, name: 'Work' }, { references })
        ).rejects.toThrow(/already called/);
        expect(updateLabel).not.toHaveBeenCalled();
    });

    it('refuses when the names match after trimming', async () => {
        const { references, labelReference, updateLabel, deps } = setUp([label()]);

        await expect(
            createRenameLabelHandler(deps)({ label: labelReference, name: '  Work  ' }, { references })
        ).rejects.toThrow(/already called/);
        expect(updateLabel).not.toHaveBeenCalled();
    });
});
