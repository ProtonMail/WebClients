import {
    type AutofillableFrames,
    getFrameParentFormId,
    isFrameContainedInParentForm,
} from 'proton-pass-extension/lib/utils/frames';
import type { AutofillActionDTO } from 'proton-pass-extension/types/autofill';
import type { FrameAttributes, FrameFieldMatch, FrameFormMatch, FrameForms } from 'proton-pass-extension/types/frames';

import { CCFieldType, FieldType } from '@proton/pass/fathom/labels';
import type { FrameId, MaybeNull } from '@proton/pass/types';

/** Maximum distance (in frames) from the source frame when clustering.
 * Limits traversal in both directions to prevent excessive searches. */
export const MAX_CLUSTER_DISTANCE = 2;

type CCRequirement = CCFieldType | CCFieldType[];

const CC_REQUIREMENTS: CCRequirement[][] = [
    [CCFieldType.NUMBER],
    [CCFieldType.CSC],
    [CCFieldType.EXP, [CCFieldType.EXP_MONTH, CCFieldType.EXP_YEAR]],
    [CCFieldType.NAME, [CCFieldType.FIRSTNAME, CCFieldType.LASTNAME]],
];

/** Checks if a set of credit card fields satisfies all completeness requirements.
 * Returns true if every requirement group has at least one satisfied alternative. */
export const isCCFormComplete = (fields: Set<CCFieldType>): boolean =>
    CC_REQUIREMENTS.every((requirements) =>
        requirements.some((requirement) => {
            if (Array.isArray(requirement)) return requirement.every((type) => fields.has(type));
            else return fields.has(requirement);
        })
    );

const isCCField = (field: FrameFieldMatch): field is Required<FrameFieldMatch<FieldType.CREDIT_CARD>> =>
    field.fieldType === FieldType.CREDIT_CARD && field.fieldSubType !== undefined;

export type FrameFormClusters = Map<FrameId, Set<string>>;

/** Resolves which forms across multiple frames should be autofilled together
 * when a credit card field is triggered. Handles PCI-compliant payment forms
 * where CC fields are isolated in cross-origin iframes.
 *
 * Algorithm: Starting from the source field, traverse down to child iframes
 * and up to parent forms, clustering all fields that belong to the same
 * logical form. Stops early when a complete CC form is found or when the
 * maximum cluster distance is exceeded. */
export const resolveCCFormClusters = async (
    frames: AutofillableFrames,
    frameForms: FrameForms[],
    payload: AutofillActionDTO
): Promise<FrameFormClusters> => {
    const sourceFormId = payload.formId;
    const sourceFrameId = payload.frameId;
    const tabId = frames.get(sourceFrameId)!.tabId;

    /** The final cluster of form IDs that should be autofilled together.
     * Initialized with the source form ID that triggered the autofill */
    const results: FrameFormClusters = new Map();
    results.set(sourceFrameId, new Set([sourceFormId]));

    /** Track which frames we've already visited to avoid redundant
     * traversal and infinite loops in the frame hierarchy */
    const visitedFrames = new Set<FrameId>();

    /** Accumulate credit card field types we've discovered across
     * all forms - used to determine if we have a complete CC form */
    const ccFields = new Set<CCFieldType>();

    /** Map of parent frame ID to array of child frame IDs - represents
     * the frame hierarchy for efficient child lookup */
    const childrenMap = new Map<FrameId, FrameId[]>();

    /** Map of frame ID to its detected CC forms - pre-filtered to only
     * include forms containing credit card fields */
    const formMap = new Map<FrameId, FrameFormMatch[]>();

    /** Map of frame ID to its attributes (position, dimensions, etc) -
     * needed for containment queries to the parent frame */
    const frameAttrs = new Map<FrameId, FrameAttributes>();

    const getFrameChildren = (frameId: FrameId) => childrenMap.get(frameId) ?? [];
    const getFrameForms = (frameId: FrameId) => formMap.get(frameId) ?? [];
    const getFrameAttrs = (frameId: FrameId) => frameAttrs.get(frameId) ?? {};

    /** Extract and collect CC field types from a form's fields.
     * Only processes fields that are credit card fields with subtypes. */
    const collectFormFields = (form: FrameFormMatch) => {
        form.fields.forEach((field) => isCCField(field) && ccFields.add(field.fieldSubType));
    };

    /** Collect all forms from a frame (or a specific form by ID) and
     * accumulate their fields into our cluster. If `formId` is provided,
     * only collects forms matching that ID (used when parent frame has
     * multiple forms and we need to filter to the containing form) */
    const collectFrameForms = (frameId: FrameId, formId?: string) => {
        const forms = getFrameForms(frameId);
        forms.forEach((form) => {
            if (formId && form.formId !== formId) return;
            const formIds = results.get(frameId) ?? new Set();
            formIds.add(form.formId);
            results.set(frameId, formIds);
            collectFormFields(form);
        });
    };

    /** Recursively traverse down the frame hierarchy from a given frame,
     * collecting CC forms from child frames. If formId is provided, validates
     * that each child frame is contained within that form before collecting.
     * Returns true if a complete CC form is found during traversal.
     * The formId constraint is only checked for direct children. Deeper
     * descendants inherit containment transitively to avoid redundant queries. */
    const traverseDown = async (frameId: FrameId, formId: MaybeNull<string>, depth: number = 0): Promise<boolean> => {
        if (Math.abs(depth) >= MAX_CLUSTER_DISTANCE) return false;

        for (const child of getFrameChildren(frameId)) {
            if (visitedFrames.has(child)) continue;
            visitedFrames.add(child);

            const contained = formId
                ? await isFrameContainedInParentForm(formId, {
                      childFrameAttributes: getFrameAttrs(child),
                      childFrameID: child,
                      parentFrameID: frameId,
                      tabId,
                  })
                : true;

            if (contained) {
                collectFrameForms(child);

                /** Early termination: stop if we've found all required CC fields */
                if (isCCFormComplete(ccFields)) return true;

                /** Recurse into child's children. Pass null as formId since we've
                 * already validated containment at depth 1 - deeper descendants
                 * are implicitly part of the cluster */
                if (await traverseDown(child, null, depth + 1)) return true;
            }
        }

        return false;
    };

    /** Walk up the frame hierarchy from a given frame, finding parent forms
     * that contain the current frame and collecting their fields. For each parent,
     * we also traverse down into sibling frames (other children of the same parent
     * form) to ensure we capture all fields in the cluster */
    const traverseUp = async (frameId: FrameId, depth: number = 0): Promise<void> => {
        if (Math.abs(depth) >= MAX_CLUSTER_DISTANCE) return;

        const parent = frames.get(frameId)?.frame.parent ?? null;

        /** Stop if we've reached the top frame or already visited this parent */
        if (parent === null || visitedFrames.has(parent)) return;
        visitedFrames.add(parent);

        /** Query the parent frame to find which of its forms (if any) contains
         * the current child frame. Returns null if the frame is uncontained */
        const formId = await getFrameParentFormId({
            childFrameAttributes: getFrameAttrs(frameId),
            childFrameID: frameId,
            parentFrameID: parent,
            tabId,
        });

        const parentForms = getFrameForms(parent);

        /** Determine if we should continue traversal through this parent:
         * - formId !== null: child is contained in a parent form (standard case)
         * - formId === null && parentForms.length === 0: transient container frame
         *   (no forms, just a structural iframe - continue to reach grandchildren)
         * - formId === null && parentForms.length > 0: uncontained child (conservative
         *   approach - stop to prevent over-clustering unrelated fields) */
        const shouldContinue = formId !== null || parentForms.length === 0;
        if (!shouldContinue) return;

        /** Collect parent form fields if we have a containing form */
        if (formId) {
            collectFrameForms(parent, formId);
            if (isCCFormComplete(ccFields)) return;
        }

        /** Traverse down from parent to collect sibling frames. Pass formId as
         * constraint when available (filters to siblings in same form), or null
         * for transient frames (collects all children). */
        await traverseDown(parent, formId, depth - 1);

        /** Continue walking up if still incomplete */
        if (!isCCFormComplete(ccFields)) await traverseUp(parent, depth - 1);
    };

    /** Build the frame hierarchy map: for each frame, register it as a
     * child of its parent. This creates the childrenMap used for traversal */
    frames.forEach(({ frame }) => {
        if (frame.parent !== null) {
            const children = childrenMap.get(frame.parent) ?? [];
            children.push(frame.frameId);
            childrenMap.set(frame.parent, children);
        }
    });

    /** Build the form map: for each frame, filter to CC forms and store them.
     * Special handling for source frame: only keep the source form since our
     * content-script detectors already clustered fields correctly within that
     * frame. Also collect initial fields from the source form */
    frameForms.forEach(({ frameId, forms, frameAttributes }) => {
        frameAttrs.set(frameId, frameAttributes);

        const ccFormsInFrame = forms.filter((form) => form.fields.some(isCCField));

        if (frameId !== sourceFrameId) {
            /** For non-source frames, keep all CC forms (we'll filter during traversal) */
            formMap.set(frameId, ccFormsInFrame);
        } else {
            /** For source frame, filter to only the form that triggered autofill */
            const sourceForm = ccFormsInFrame.find((form) => form.formId === sourceFormId);
            if (sourceForm) {
                formMap.set(frameId, [sourceForm]);
                collectFormFields(sourceForm);
            }
        }
    });

    /** Edge case: source form has no CC fields. This shouldn't happen in
     * normal operation but guards against malformed detection results. */
    if (ccFields.size === 0) return new Map();

    /** Early exit: if the source form alone already contains all required
     * CC fields, no need to traverse the frame hierarchy. */
    if (isCCFormComplete(ccFields)) return results;

    /** Phase 1: Traverse down from source frame to collect child iframe fields.
     * This handles the case where autofill is triggered from a parent frame
     * that contains child iframes with additional CC fields */
    const complete = await traverseDown(sourceFrameId, sourceFormId);

    /** Phase 2: If not complete, walk up the frame hierarchy to find parent
     * forms and sibling iframes that belong to the same logical form cluster */
    if (!complete) await traverseUp(sourceFrameId);

    visitedFrames.clear();
    ccFields.clear();
    childrenMap.clear();
    formMap.clear();

    /** Return the complete cluster of form IDs that should be autofilled */
    return results;
};
