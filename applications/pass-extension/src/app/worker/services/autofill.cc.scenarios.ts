import { CCFieldType } from '@proton/pass/fathom/labels';
import type { FrameId, MaybeNull } from '@proton/pass/types';

export type AutofillFrameStructure = {
    frameId: FrameId;
    parent: MaybeNull<FrameId>;
    forms: {
        formId: string;
        fields: { fieldSubType: CCFieldType }[];
        containedFrames: FrameId[];
    }[];
};

/** Standard Stripe-like payment form: parent frame with name field,
 * child iframes for PCI-compliant card number and CVV isolation */
export const StripeLikePaymentForm: AutofillFrameStructure[] = [
    {
        frameId: 0,
        parent: null,
        forms: [
            {
                formId: '0::payment',
                fields: [{ fieldSubType: CCFieldType.NAME }],
                containedFrames: [1, 2],
            },
        ],
    },
    {
        frameId: 1,
        parent: 0,
        forms: [
            {
                formId: '1::card-number',
                fields: [{ fieldSubType: CCFieldType.NUMBER }],
                containedFrames: [],
            },
        ],
    },
    {
        frameId: 2,
        parent: 0,
        forms: [
            {
                formId: '2::cvv',
                fields: [{ fieldSubType: CCFieldType.CSC }],
                containedFrames: [],
            },
        ],
    },
];

/** Parent frame with multiple payment-like forms, Tests form disambiguation. */
export const MultipleFormsInParent: AutofillFrameStructure[] = [
    {
        frameId: 0,
        parent: null,
        forms: [
            {
                formId: '0::payment',
                fields: [{ fieldSubType: CCFieldType.NAME }],
                containedFrames: [1, 2],
            },
            {
                formId: '0::gift-card',
                fields: [{ fieldSubType: CCFieldType.NUMBER }],
                containedFrames: [],
            },
        ],
    },
    {
        frameId: 1,
        parent: 0,
        forms: [
            {
                formId: '1::card-number',
                fields: [{ fieldSubType: CCFieldType.NUMBER }],
                containedFrames: [],
            },
        ],
    },
    {
        frameId: 2,
        parent: 0,
        forms: [
            {
                formId: '2::cvv',
                fields: [{ fieldSubType: CCFieldType.CSC }],
                containedFrames: [],
            },
        ],
    },
];

/** Child frame not contained in any parent form. Tests conservative
 * behavior - should stop traversal and not cluster uncontained frames */
export const UncontainedChildFrame: AutofillFrameStructure[] = [
    {
        frameId: 0,
        parent: null,
        forms: [
            {
                formId: '0::payment',
                fields: [{ fieldSubType: CCFieldType.NAME }],
                containedFrames: [],
            },
        ],
    },
    {
        frameId: 1,
        parent: 0,
        forms: [
            {
                formId: '1::card-number',
                fields: [{ fieldSubType: CCFieldType.NUMBER }],
                containedFrames: [],
            },
        ],
    },
];

/** Nested iframe structure: parent → child → grandchild.
 * Tests transitive containment optimization (no containment check
 * needed for grandchild since child is already validated) */
export const DeeplyNestedFrames: AutofillFrameStructure[] = [
    {
        frameId: 0,
        parent: null,
        forms: [
            {
                formId: '0::checkout',
                fields: [{ fieldSubType: CCFieldType.NAME }],
                containedFrames: [1],
            },
        ],
    },
    {
        frameId: 1,
        parent: 0,
        forms: [
            {
                formId: '1::card-details',
                fields: [{ fieldSubType: CCFieldType.NUMBER }],
                containedFrames: [2],
            },
        ],
    },
    {
        frameId: 2,
        parent: 1,
        forms: [
            {
                formId: '2::cvv-iframe',
                fields: [{ fieldSubType: CCFieldType.CSC }],
                containedFrames: [],
            },
        ],
    },
];

/** Complete form within a single child frame. Should return early
 * without traversing up or to siblings */
export const CompleteFormInChildFrame: AutofillFrameStructure[] = [
    {
        frameId: 0,
        parent: null,
        forms: [
            {
                formId: '0::wrapper',
                fields: [],
                containedFrames: [1, 2],
            },
        ],
    },
    {
        frameId: 1,
        parent: 0,
        forms: [
            {
                formId: '1::complete-cc-form',
                fields: [
                    { fieldSubType: CCFieldType.NUMBER },
                    { fieldSubType: CCFieldType.CSC },
                    { fieldSubType: CCFieldType.EXP },
                    { fieldSubType: CCFieldType.NAME },
                ],
                containedFrames: [],
            },
        ],
    },
    {
        frameId: 2,
        parent: 0,
        forms: [
            {
                formId: '2::unrelated',
                fields: [],
                containedFrames: [],
            },
        ],
    },
];

/** Sibling frames at same level, both children of payment form.
 * Tests that walking up from one sibling discovers the other */
export const SiblingFramesSameLevel: AutofillFrameStructure[] = [
    {
        frameId: 0,
        parent: null,
        forms: [
            {
                formId: '0::payment',
                fields: [{ fieldSubType: CCFieldType.NAME }],
                containedFrames: [1, 2, 3],
            },
        ],
    },
    {
        frameId: 1,
        parent: 0,
        forms: [
            {
                formId: '1::card-number',
                fields: [{ fieldSubType: CCFieldType.NUMBER }],
                containedFrames: [],
            },
        ],
    },
    {
        frameId: 2,
        parent: 0,
        forms: [
            {
                formId: '2::expiry',
                fields: [{ fieldSubType: CCFieldType.EXP }],
                containedFrames: [],
            },
        ],
    },
    {
        frameId: 3,
        parent: 0,
        forms: [
            {
                formId: '3::cvv',
                fields: [{ fieldSubType: CCFieldType.CSC }],
                containedFrames: [],
            },
        ],
    },
];

/** Multi-level nesting with transient (formless) intermediate frame.
 * Tests that traversal continues through "form-less" containers */
export const TransientIntermediateFrame: AutofillFrameStructure[] = [
    {
        frameId: 0,
        parent: null,
        forms: [
            {
                formId: '0::checkout',
                fields: [{ fieldSubType: CCFieldType.NAME }],
                containedFrames: [1], // Contains the transient iframe
            },
        ],
    },
    {
        frameId: 1,
        parent: 0,
        forms: [], // Transient frame - no forms, just a container
    },
    {
        frameId: 2,
        parent: 1,
        forms: [
            {
                formId: '2::card-number',
                fields: [{ fieldSubType: CCFieldType.NUMBER }],
                containedFrames: [],
            },
        ],
    },
    {
        frameId: 3,
        parent: 1,
        forms: [
            {
                formId: '3::expiry-cvv',
                fields: [{ fieldSubType: CCFieldType.EXP }, { fieldSubType: CCFieldType.CSC }],
                containedFrames: [],
            },
        ],
    },
];

/** Deep hierarchy exceeding max cluster distance. Tests that traversal
 * stops at the distance limit and doesn't cluster frames too far from source */
export const ExceedsMaxClusterDistance: AutofillFrameStructure[] = [
    {
        frameId: 0,
        parent: null,
        forms: [
            {
                formId: '0::top',
                fields: [{ fieldSubType: CCFieldType.NAME }],
                containedFrames: [1],
            },
        ],
    },
    {
        frameId: 1,
        parent: 0,
        forms: [
            {
                formId: '1::level-1',
                fields: [{ fieldSubType: CCFieldType.NUMBER }],
                containedFrames: [2],
            },
        ],
    },
    {
        frameId: 2,
        parent: 1,
        forms: [
            {
                formId: '2::level-2',
                fields: [{ fieldSubType: CCFieldType.EXP }],
                containedFrames: [3],
            },
        ],
    },
    {
        frameId: 3,
        parent: 2,
        forms: [
            {
                formId: '3::level-3',
                fields: [{ fieldSubType: CCFieldType.CSC }],
                containedFrames: [4],
            },
        ],
    },
    {
        frameId: 4,
        parent: 3,
        forms: [
            {
                formId: '4::level-4',
                fields: [{ fieldSubType: CCFieldType.FIRSTNAME }, { fieldSubType: CCFieldType.LASTNAME }],
                containedFrames: [5],
            },
        ],
    },
    {
        frameId: 5,
        parent: 4,
        forms: [
            {
                formId: '5::level-5',
                fields: [{ fieldSubType: CCFieldType.EXP_MONTH }],
                containedFrames: [],
            },
        ],
    },
];
