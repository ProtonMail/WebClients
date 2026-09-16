import { c } from 'ttag';

import { IcPencil } from '@proton/icons/icons/IcPencil';
import { ToolInputError } from '@proton/llm/lib/lumoAgent/contracts/errors';
import type {
    ActionRequest,
    ReferenceLabels,
    ToolDefinition,
    ToolHandler,
} from '@proton/llm/lib/lumoAgent/contracts/types';
import TextFieldBody from '@proton/llm/lib/lumoAgent/ui/cardBodies/TextFieldBody';
import type { CardBodyProps, CardRenderer } from '@proton/llm/lib/lumoAgent/ui/types';
import sentenceValue from '@proton/lumo-ui/primitives/sentenceValue';

import { resolveTypedId } from '../../helpers/references';
import type { MailToolDeps, MailToolModule } from '../../toolModule';
import { recordedName, referenceName } from './emailSelection';

export interface RenameLabelParams {
    label: string;
    name: string;
}

export const renameLabelDefinition: ToolDefinition<RenameLabelParams, void> = {
    name: 'rename_label',
    kind: 'mutation',
    toolDescription:
        'Rename an existing custom label. `label` is a label-… reference from list_labels; `name` is the new name. Use for "rename label X to Y". This changes only the name — the label keeps its colour, and everything tagged with it stays tagged. list_labels shows each label\'s current name: if the label the user means is already called what they are asking for, tell them there is nothing to do instead of proposing this. Proposed to the user for confirmation before it runs. Example: { "label": "label-m3n4p5", "name": "Receipts" }.',
    freeTextParams: ['name'],
    paramsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['label', 'name'],
        properties: { label: { type: 'string' }, name: { type: 'string' } },
    },
    examples: [
        {
            context:
                'list_labels returned `label-m3n4p5 | "Work" | #cf3a6e` and the user asks to rename it to Projects.',
            call: { label: 'label-m3n4p5', name: 'Projects' },
        },
    ],
    serializeForLumo: () => '',
    summarizeChip: () => ({ label: c('Info').t`Rename label` }),
};

export const createRenameLabelHandler =
    (mail: MailToolDeps): ToolHandler<RenameLabelParams, void> =>
    async ({ label, name }, { references }) => {
        const id = resolveTypedId(label, ['label'], references);
        const existing = mail.getLabels().find((candidate) => candidate.ID === id);
        if (!existing) {
            throw new ToolInputError(`Label ${label} no longer exists. Call list_labels again for the labels that do.`);
        }

        if (existing.Name.trim() === name.trim()) {
            throw new ToolInputError(
                `Label ${label} is already called "${existing.Name}". There is nothing to rename.`
            );
        }

        await mail.updateLabel({ labelID: existing.ID, label: { ...existing, Name: name.trim() } });
    };

const newName = (source: ActionRequest | Record<string, any>): string => String(source.name ?? '');

const currentLabelName = (action: ActionRequest, labels: ReferenceLabels): string =>
    referenceName(action.label, labels);

const renameLabelCardRenderer: CardRenderer = {
    icon: IcPencil,
    sentence: (action, labels) => {
        const named = recordedName(action.label, labels);
        if (!named) {
            return c('Info').t`Rename this label`;
        }
        const label = sentenceValue(named);

        // translator: the label being renamed; the new name is the field below, e.g. "Rename Work to…"
        return c('Action: rename label').jt`Rename ${label} to…`;
    },
    renderBody: ({ params, onChange }: CardBodyProps) => (
        <TextFieldBody
            label={c('Label').t`New name`}
            value={newName(params)}
            onChange={(name) => onChange({ ...params, name })}
        />
    ),
    canApply: (params) => newName(params).trim().length > 0,
    detail: (action, labels) => `${currentLabelName(action, labels)} → ${newName(action)}`,
};

export const renameLabelModule: MailToolModule = {
    definition: renameLabelDefinition,
    createHandler: createRenameLabelHandler,
    cardRenderer: renameLabelCardRenderer,
};
