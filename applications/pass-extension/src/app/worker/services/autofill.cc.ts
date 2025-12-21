import { backgroundMessage, sendTabMessage } from 'proton-pass-extension/lib/message/send-message';
import { isCCField } from 'proton-pass-extension/lib/utils/field';
import { resolveFieldSections } from 'proton-pass-extension/lib/utils/field.sections';
import { type AutofillableFrames, getFrameScore } from 'proton-pass-extension/lib/utils/frames';
import type { AutofillActionDTO } from 'proton-pass-extension/types/autofill';
import type { AbstractField } from 'proton-pass-extension/types/field';
import type { FrameAttributes, FrameField } from 'proton-pass-extension/types/frames';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import type { CCFieldType, FieldType } from '@proton/pass/fathom/labels';
import type { MaybeNull } from '@proton/pass/types/utils/index';
import type { FrameId, TabId } from '@proton/pass/types/worker/runtime';
import noop from '@proton/utils/noop';

export type ClusterFrameForm = { fields: ClusterFrameFormItem[]; formId: string };
export type ClusterFrame = { forms: ClusterFrameForm[]; frameAttributes: FrameAttributes };
export type ClusterFrameFormItem =
    | ({ type: 'field'; fieldId: string } & AbstractField<FieldType>)
    | { type: 'frame'; frameAttributes?: FrameAttributes; frameId?: FrameId };

/** Resolves which credit card fields across multiple frames should be autofilled together
 * when a payment autofill is triggered. This handles PCI-compliant payment forms where CC
 * fields are distributed across multiple cross-origin iframes for security. Document order
 * should be preserved to determine sub-sections.
 *
 * 1. Build frame hierarchy maps for efficient parent/child lookups
 * 2. Fetch clusterable items (fields + iframe references) from all frames
 * 3. Walk UP from source frame to find the root containing form
 * 4. Walk DOWN from root collecting all fields in document order
 * 5. Resolve field sections to group related fields
 * 6. Filter to only fields in the same section as the triggered field */
export const clusterCCFormFields = (
    frames: AutofillableFrames,
    clusters: Map<FrameId, ClusterFrame>,
    payload: AutofillActionDTO
): Map<FrameId, FrameField[]> => {
    const sourceFrameId = payload.frameId;
    const sourceFormId = payload.formId;

    const fields: (FrameField & AbstractField<FieldType>)[] = [];
    const frameChildren = new Map<FrameId, FrameId[]>();
    const visisted = new Set<FrameId>();
    const result = new Map<FrameId, FrameField[]>();

    const getParentFrameId = (frameId: FrameId): MaybeNull<FrameId> => frames.get(frameId)?.frame.parent ?? null;
    const getFrameChildren = (frameId: FrameId): FrameId[] => frameChildren.get(frameId) ?? [];

    /** Build child frame hierarchy map for quick parent/child lookups */
    frames.forEach(({ frame }) => {
        if (frame.parent !== null) {
            const children = getFrameChildren(frame.parent);
            children.push(frame.frameId);
            frameChildren.set(frame.parent, children);
        }
    });

    /** Resolves the `frameId` of a child iframe referenced within a form.
     * Only searches among direct children of the parent frame for efficiency.
     * When forms contain iframe references, this function determines which actual
     * frame in the tab corresponds to that iframe reference. Uses two strategies:
     * 1. Direct frameId matching (available on browsers with `getFrameId` API)
     * 2. Attribute-based scoring (fallback for Chrome which lacks `getFrameId`) */
    const resolveFieldChildFrame = (
        frameId: FrameId,
        field: ClusterFrameFormItem & { type: 'frame' }
    ): MaybeNull<FrameId> => {
        if (field.frameId && clusters.has(field.frameId)) return field.frameId;
        if (field.frameAttributes) {
            let bestFrameId: MaybeNull<FrameId> = null;
            let bestScore = 0;

            for (const [candidateFrameId, cluster] of clusters) {
                if (getParentFrameId(candidateFrameId) === frameId) {
                    const score = getFrameScore(field.frameAttributes, cluster.frameAttributes);
                    if (score > bestScore) {
                        bestScore = score;
                        bestFrameId = candidateFrameId;
                    }
                }
            }

            if (bestScore > 0 && bestFrameId) return bestFrameId;
        }

        return null;
    };

    /** Finds which form in the parent frame contains the given child frame.
     * During upward traversal, we need to determine which parent form contains
     * our current frame to continue the walk-up correctly. This function:
     * 1. Looks at the parent frame's clusterable items for iframe references
     * 2. Matches the child frame using direct frameId or attribute scoring
     * 3. HYDRATES the matched iframe reference by storing the resolved `frameId`
     *    back into the cluster to avoid re-scoring during collection phase. */
    const resolveFrameParentForm = (
        frameId: FrameId,
        frameAttributes: FrameAttributes
    ): MaybeNull<ClusterFrameForm> => {
        const parent = getParentFrameId(frameId);
        if (parent === null) return null;

        const parentCluster = clusters.get(parent);
        if (!parentCluster) return null;

        let bestForm: MaybeNull<ClusterFrameForm> = null;
        let bestItem: MaybeNull<ClusterFrameFormItem & { type: 'frame' }> = null;
        let bestScore = 0;

        for (const form of parentCluster.forms) {
            for (const item of form.fields) {
                if (item.type === 'frame') {
                    if (item.frameId === frameId) return form;
                    if (!item.frameId && item.frameAttributes) {
                        const score = getFrameScore(frameAttributes, item.frameAttributes);
                        if (score > bestScore) {
                            bestScore = score;
                            bestForm = form;
                            bestItem = item;
                        }
                    }
                }
            }
        }

        if (bestScore > 0 && bestForm) {
            if (bestItem) bestItem.frameId = bestItem.frameId ?? frameId;
            return bestForm;
        }

        return null;
    };

    type FrameRoot = { frameId: FrameId; formId: string };

    /** Handles edge-case where no parent form could be resolved but child
     * frames at depth=1 contain complete, non-overlapping CC forms. Returns
     * candidate roots when cross-frame autofilling is unambiguous. */
    const findUnambiguousChildRoots = (parentFrameId: FrameId): FrameRoot[] => {
        const parentCluster = clusters.get(parentFrameId);
        const parentFormsCount = parentCluster?.forms.length ?? 0;
        if (parentFormsCount > 0) return [];

        const seen = new Set<CCFieldType>();
        const roots: FrameRoot[] = [];

        for (const childFrameId of getFrameChildren(parentFrameId)) {
            for (const form of clusters.get(childFrameId)?.forms ?? []) {
                for (const field of form.fields) {
                    if (field.type === 'frame') return [];
                    if (!isCCField(field)) continue;
                    if (seen.has(field.fieldSubType)) return [];
                    seen.add(field.fieldSubType);
                }

                roots.push({ frameId: childFrameId, formId: form.formId });
            }
        }

        return seen.size > 0 ? roots : [];
    };

    /** Walks up the frame hierarchy to find the root containing form.
     * Starting from the source frame, and walk UP through the frame
     * hierarchy to find the top-most form that contains the original frame.
     * This determines the root of our clustering scope. */
    const findFrameRoots = (startFrameId: FrameId): FrameRoot[] => {
        let currentFrameId = startFrameId;
        let currentFormId = sourceFormId;

        /** If top-frame: no need to traverse */
        if (currentFrameId === 0) return [{ frameId: 0, formId: currentFormId }];

        while (true) {
            const formId = currentFormId;
            const cluster = clusters.get(currentFrameId);
            if (!cluster || !cluster.forms.some((form) => form.formId === formId)) break;

            const parentForm = resolveFrameParentForm(currentFrameId, cluster.frameAttributes);
            const parent = getParentFrameId(currentFrameId);

            if (parent === null) break;

            if (!parentForm) {
                const childRoots = findUnambiguousChildRoots(parent);
                if (childRoots.length > 0) return childRoots;
                break;
            }

            currentFrameId = parent;
            currentFormId = parentForm?.formId;
        }

        return [{ frameId: currentFrameId, formId: currentFormId }];
    };

    /** Recursively collects all credit card fields in document order.
     * Starting from the root frame/form, this function walks DOWN through the
     * frame hierarchy collecting all CC fields while preserving document order.
     * This is the main collection phase that builds our final field list.
     * Clusterable items are returned in document order by the content script.
     * When we encounter an iframe reference, we immediately process its contents
     * inline, which preserves the natural order. */
    const collectFrameItems = (frameId: FrameId, formId?: string) => {
        if (visisted.has(frameId)) return;
        visisted.add(frameId);

        const cluster = clusters.get(frameId);
        if (!cluster) return;

        const formsToProcess = formId ? cluster.forms.filter((form) => form.formId === formId) : cluster.forms;

        for (const form of formsToProcess) {
            const { formId } = form;
            for (const item of form.fields) {
                switch (item.type) {
                    case 'field':
                        if (!isCCField(item)) break;
                        const { fieldId, fieldType, fieldSubType } = item;
                        fields.push({ fieldId, formId, frameId, fieldType, fieldSubType });
                        break;

                    case 'frame':
                        const childFrameId = resolveFieldChildFrame(frameId, item);
                        if (childFrameId) collectFrameItems(childFrameId);
                        break;
                }
            }
        }
    };

    /** 1. Find root and collect all fields in document order */
    const roots = findFrameRoots(sourceFrameId);
    roots.forEach((root) => collectFrameItems(root.frameId, root.formId));

    /** 2. Resolve field sections to group related fields. This analyzes
     * all collected fields and groups them into logical sections. */
    resolveFieldSections(fields);

    /** 3. Filter to only fields in the same section as the triggered field
     * This ensures we only autofill fields that are logically related to the
     * field that triggered the autofill action. */
    const sectionIdx = fields.find((field) => field.fieldId === payload.fieldId)?.sectionIndex;
    const autofillableFields = fields.filter((field) => field.sectionIndex === sectionIdx);

    /** 4. Organize results by `frameId` for cross-frame autofill */
    autofillableFields.forEach(({ frameId, fieldId, formId }) => {
        const frameFields = result.get(frameId) ?? [];
        frameFields.push({ fieldId, frameId, formId });
        result.set(frameId, frameFields);
    });

    return result;
};

export const resolveFormClusters = async (tabId: TabId, frames: FrameId[]): Promise<Map<FrameId, ClusterFrame>> => {
    const clusters = new Map<FrameId, ClusterFrame>();

    await Promise.all(
        frames.map(async (frameId) => {
            const message = backgroundMessage({ type: WorkerMessageType.FRAME_FORM_CLUSTER });
            const res = await sendTabMessage(message, { frameId, tabId }).catch(noop);
            if (res) clusters.set(frameId, res);
            return res;
        })
    );

    return clusters;
};

export const resolveCCFormFields = async (
    frames: AutofillableFrames,
    tabId: TabId,
    payload: AutofillActionDTO
): Promise<{ frameId: FrameId; fields: FrameField[] }[]> => {
    /** Get clusterable items for all autofillable frames */
    const clusters = await resolveFormClusters(tabId, Array.from(frames.keys()));
    const clusteredFields = clusterCCFormFields(frames, clusters, payload);

    /** Start from source frameId */
    const fields = Array.from(clusteredFields.entries()).map(([frameId, fields]) => ({ frameId, fields }));
    const startAt = fields.findIndex(({ frameId }) => frameId === payload.frameId);
    if (startAt !== -1) return fields.slice(startAt).concat(fields.slice(0, startAt));

    return fields;
};
