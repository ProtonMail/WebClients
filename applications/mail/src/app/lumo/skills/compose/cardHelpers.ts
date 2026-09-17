import type { ReferenceLabels } from '@proton/llm/lib/lumoAgent/contracts/types';

export const recipientName = (ref: string, labels: ReferenceLabels): string => labels[ref]?.title ?? ref;

export const recipientList = (refs: string[] | undefined, labels: ReferenceLabels): string | undefined => {
    if (!refs?.length) {
        return undefined;
    }
    return refs.map((ref) => recipientName(ref, labels)).join(', ');
};
