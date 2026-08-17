import type { CardBodyProps } from '@proton/components/components/lumoAgent/types';
import type { ActionRequest } from '@proton/llm/lib/lumoAgent/contracts/types';
import { MoveItemsCard } from '@proton/lumo-ui';

export const referenceName = (reference: unknown, labels: Record<string, string>): string => {
    const key = String(reference);
    return labels[key] ?? key;
};

export const emailIds = (source: ActionRequest | Record<string, any>): string[] => (source.ids as string[]) ?? [];

/** Renders the full proposed set, not just the selection, so a deselected row can be re-ticked. */
export const renderEmailSelectionBody = ({ action, params, labels, onChange }: CardBodyProps) => {
    const selectedIds = emailIds(params);

    return (
        <MoveItemsCard
            items={emailIds(action).map((id) => ({ id, label: referenceName(id, labels) }))}
            selectedIds={selectedIds}
            onToggle={(id, checked) =>
                onChange({ ...params, ids: checked ? [...selectedIds, id] : selectedIds.filter((x) => x !== id) })
            }
        />
    );
};

/** Deselecting every row leaves nothing to apply, so Confirm is disabled rather than settling on a no-op. */
export const hasEmailSelection = (params: Record<string, any>): boolean => emailIds(params).length > 0;
