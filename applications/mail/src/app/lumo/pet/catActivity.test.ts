import type { LumoAgentItem } from '@proton/llm/lib/lumoAgent/ui/types';
import { ConfirmStatus } from '@proton/llm/lib/lumoAgent/ui/types';

import { DraftKind } from '../helpers/draftKind';
import { createDraftDefinition } from '../skills/compose/createDraft';
import { reviseDraftDefinition } from '../skills/compose/reviseDraft';
import { moveEmailsDefinition } from '../skills/organise/moveEmails';
import { findContactsDefinition } from '../skills/reads/findContacts';
import { listFoldersDefinition } from '../skills/reads/listFolders';
import { listLabelsDefinition } from '../skills/reads/listLabels';
import { openFolderDefinition } from '../skills/reads/openFolder';
import { searchDefinition } from '../skills/reads/search';
import { viewEmailsDefinition } from '../skills/reads/viewEmails';
import { selectCatActivity } from './catActivity';
import { CatActivity } from './catPose';

const chip = (id: number, tool: string): LumoAgentItem => ({ id, kind: 'chip', tool, label: 'Looked', payload: '' });
const reply: LumoAgentItem = { id: 9, kind: 'reply', text: 'Here you go.' };

const draftCard = (tool: string, status: ConfirmStatus): LumoAgentItem => ({
    id: 5,
    kind: 'confirm',
    action: { type: tool, kind: DraftKind.NEW, to: ['ada@example.com'], cc: [], subject: 'Hi', body: 'Hello' },
    labels: {},
    status,
});

const moveCard = (id: number, location: string | null, status: ConfirmStatus): LumoAgentItem => ({
    id,
    kind: 'confirm',
    action: {
        type: moveEmailsDefinition.name,
        ids: ['email-a1b2c3'],
        folder: location ? null : 'folder-x7b2q1',
        location,
    },
    labels: {},
    status,
});

describe('selectCatActivity', () => {
    it.each([
        [openFolderDefinition.name, CatActivity.BROWSE_FOLDERS],
        [listFoldersDefinition.name, CatActivity.BROWSE_FOLDERS],
        [listLabelsDefinition.name, CatActivity.BROWSE_FOLDERS],
        [searchDefinition.name, CatActivity.SEARCH],
        [findContactsDefinition.name, CatActivity.SEARCH],
    ])('acts out %s while Lumo carries on after it', (tool, activity) => {
        expect(selectCatActivity([chip(1, tool)], true)).toBe(activity);
    });

    it('has no activity for a read it does not act out', () => {
        expect(selectCatActivity([chip(1, viewEmailsDefinition.name)], true)).toBeNull();
    });

    it('stops once Lumo replies after the read', () => {
        expect(selectCatActivity([chip(1, searchDefinition.name), reply], true)).toBeNull();
    });

    it('stops once Lumo is done', () => {
        expect(selectCatActivity([chip(1, searchDefinition.name)], false)).toBeNull();
    });

    it.each([createDraftDefinition.name, reviseDraftDefinition.name])('writes while the %s card waits', (tool) => {
        expect(selectCatActivity([draftCard(tool, ConfirmStatus.PENDING)], true)).toBe(CatActivity.WRITE);
    });

    it('stops writing once the draft card is answered', () => {
        expect(selectCatActivity([draftCard(createDraftDefinition.name, ConfirmStatus.APPLYING)], true)).toBeNull();
        expect(selectCatActivity([draftCard(createDraftDefinition.name, ConfirmStatus.CANCELLED)], true)).toBeNull();
    });

    it('does not write for a pending card that is not a draft', () => {
        expect(selectCatActivity([moveCard(5, 'trash', ConfirmStatus.PENDING)], true)).toBeNull();
    });
});
