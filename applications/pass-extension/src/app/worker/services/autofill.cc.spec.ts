import type { AutofillableFrames } from 'proton-pass-extension/lib/utils/frames';
import * as frameUtils from 'proton-pass-extension/lib/utils/frames';
import type { FrameForms } from 'proton-pass-extension/types/frames';

import { CCFieldType, FieldType } from '@proton/pass/fathom/labels';
import type { FrameId, MaybeNull } from '@proton/pass/types';

import type { FrameFormClusters } from './autofill.cc';
import { MAX_CLUSTER_DISTANCE, isCCFormComplete, resolveCCFormClusters } from './autofill.cc';
import * as scenarios from './autofill.cc.scenarios';

const getFrameParentFormId = jest.spyOn(frameUtils, 'getFrameParentFormId');
const isFrameContainedInParentForm = jest.spyOn(frameUtils, 'isFrameContainedInParentForm');

describe('isCCFormComplete', () => {
    const { NUMBER, CSC, EXP, EXP_MONTH, EXP_YEAR, NAME, FIRSTNAME, LASTNAME } = CCFieldType;

    test.each([
        [[NUMBER, CSC, EXP, NAME], true, 'combined fields'],
        [[NUMBER, CSC, EXP_MONTH, EXP_YEAR, NAME], true, 'split expiry'],
        [[NUMBER, CSC, EXP, FIRSTNAME, LASTNAME], true, 'split name'],
        [[NUMBER, CSC, EXP_MONTH, EXP_YEAR, FIRSTNAME, LASTNAME], true, 'all split'],
        [[CSC, EXP, NAME], false, 'missing NUMBER'],
        [[NUMBER, EXP, NAME], false, 'missing CSC'],
        [[NUMBER, CSC, NAME], false, 'missing expiry'],
        [[NUMBER, CSC, EXP_MONTH, NAME], false, 'partial expiry'],
        [[NUMBER, CSC, EXP], false, 'missing name'],
        [[NUMBER, CSC, EXP, FIRSTNAME], false, 'partial name'],
        [[], false, 'empty'],
    ])('%s → %s (%s)', (fields, expected) => {
        expect(isCCFormComplete(new Set(fields))).toBe(expected);
    });
});

type AutofillFrameStructure = {
    frameId: FrameId;
    parent: MaybeNull<FrameId>;
    forms: {
        formId: string;
        fields: { fieldSubType: CCFieldType }[];
        containedFrames: FrameId[];
    }[];
};

const createAutofillScenario = (structure: AutofillFrameStructure[]) => {
    const frameMap = new Map(structure.map((frame) => [frame.frameId, frame]));

    const autofillableFrames = new Map(
        structure.map(({ frameId, parent }) => [frameId, { frame: { frameId, parent } }])
    ) as AutofillableFrames;

    const frameForms = structure.map((frame) => ({
        frameId: frame.frameId,
        frameAttributes: {},
        forms: frame.forms.map((form) => ({
            formId: form.formId,
            fields: form.fields.map((field) => ({
                fieldType: FieldType.CREDIT_CARD,
                fieldSubType: field.fieldSubType,
            })),
        })),
    })) as any as FrameForms[];

    /** Mock query functions using test structure */
    getFrameParentFormId.mockImplementation(async (options): Promise<MaybeNull<string>> => {
        const parent = frameMap.get(options.parentFrameID);
        const containingForm = parent?.forms.find((form) => form.containedFrames.includes(options.childFrameID));
        return containingForm?.formId ?? null;
    });

    isFrameContainedInParentForm.mockImplementation(async (parentFormId, options) => {
        const formId = await frameUtils.getFrameParentFormId(options);
        return formId === parentFormId;
    });

    return { autofillableFrames, frameForms };
};

const formatResults = (clusters: FrameFormClusters): string[] =>
    Array.from(clusters.values()).flatMap((formIds) => Array.from(formIds));

describe('resolveCCFormClusters', () => {
    beforeEach(() => {
        getFrameParentFormId.mockClear();
        isFrameContainedInParentForm.mockClear();
    });

    describe('Scenario: stripe-like payment form', () => {
        test('from top frame', async () => {
            const { autofillableFrames, frameForms } = createAutofillScenario(scenarios.StripeLikePaymentForm);
            const dto = { frameId: 0, formId: '0::payment' } as any;
            const result = await resolveCCFormClusters(autofillableFrames, frameForms, dto);
            expect(formatResults(result)).toEqual(['0::payment', '1::card-number', '2::cvv']);
        });

        test('from card number iframe', async () => {
            const { autofillableFrames, frameForms } = createAutofillScenario(scenarios.StripeLikePaymentForm);
            const dto = { frameId: 1, formId: '1::card-number' } as any;
            const result = await resolveCCFormClusters(autofillableFrames, frameForms, dto);
            expect(formatResults(result)).toEqual(['1::card-number', '0::payment', '2::cvv']);
        });

        test('from cvv iframe', async () => {
            const { autofillableFrames, frameForms } = createAutofillScenario(scenarios.StripeLikePaymentForm);
            const dto = { frameId: 2, formId: '2::cvv' } as any;
            const result = await resolveCCFormClusters(autofillableFrames, frameForms, dto);
            expect(formatResults(result)).toEqual(['2::cvv', '0::payment', '1::card-number']);
        });
    });

    describe('Scenario: multiple forms in parent', () => {
        test('from payment iframe should only cluster payment forms', async () => {
            const { autofillableFrames, frameForms } = createAutofillScenario(scenarios.MultipleFormsInParent);
            const dto = { frameId: 1, formId: '1::card-number' } as any;
            const result = await resolveCCFormClusters(autofillableFrames, frameForms, dto);
            expect(formatResults(result)).toEqual(['1::card-number', '0::payment', '2::cvv']);
        });

        test('from gift-card form should only include that form', async () => {
            const { autofillableFrames, frameForms } = createAutofillScenario(scenarios.MultipleFormsInParent);
            const dto = { frameId: 0, formId: '0::gift-card' } as any;
            const result = await resolveCCFormClusters(autofillableFrames, frameForms, dto);
            expect(formatResults(result)).toEqual(['0::gift-card']);
        });

        test('from payment form in parent should include child iframes', async () => {
            const { autofillableFrames, frameForms } = createAutofillScenario(scenarios.MultipleFormsInParent);
            const dto = { frameId: 0, formId: '0::payment' } as any;
            const result = await resolveCCFormClusters(autofillableFrames, frameForms, dto);
            expect(formatResults(result)).toEqual(['0::payment', '1::card-number', '2::cvv']);
            expect(formatResults(result)).not.toContain('0::gift-card');
        });

        test('from cvv iframe should cluster payment forms', async () => {
            const { autofillableFrames, frameForms } = createAutofillScenario(scenarios.MultipleFormsInParent);
            const dto = { frameId: 2, formId: '2::cvv' } as any;
            const result = await resolveCCFormClusters(autofillableFrames, frameForms, dto);
            expect(formatResults(result)).toEqual(['2::cvv', '0::payment', '1::card-number']);
        });
    });

    describe('Scenario: uncontained frame form', () => {
        test('from uncontained child should not cluster parent', async () => {
            const { autofillableFrames, frameForms } = createAutofillScenario(scenarios.UncontainedChildFrame);
            const dto = { frameId: 1, formId: '1::card-number' } as any;
            const result = await resolveCCFormClusters(autofillableFrames, frameForms, dto);
            expect(formatResults(result)).toEqual(['1::card-number']);
            expect(formatResults(result)).not.toContain('0::payment');
        });

        test('from parent should not cluster uncontained child', async () => {
            const { autofillableFrames, frameForms } = createAutofillScenario(scenarios.UncontainedChildFrame);
            const dto = { frameId: 0, formId: '0::payment' } as any;
            const result = await resolveCCFormClusters(autofillableFrames, frameForms, dto);
            expect(formatResults(result)).toEqual(['0::payment']);
            expect(formatResults(result)).not.toContain('1::card-number');
        });
    });

    describe('Scenario: deeply nested frames', () => {
        test('from deepest frame should cluster up through all levels', async () => {
            const { autofillableFrames, frameForms } = createAutofillScenario(scenarios.DeeplyNestedFrames);
            const dto = { frameId: 2, formId: '2::cvv-iframe' } as any;
            const result = await resolveCCFormClusters(autofillableFrames, frameForms, dto);
            expect(formatResults(result)).toEqual(['2::cvv-iframe', '1::card-details', '0::checkout']);
        });

        test('from middle frame should cluster up and down', async () => {
            const { autofillableFrames, frameForms } = createAutofillScenario(scenarios.DeeplyNestedFrames);
            const dto = { frameId: 1, formId: '1::card-details' } as any;
            const result = await resolveCCFormClusters(autofillableFrames, frameForms, dto);
            expect(formatResults(result)).toEqual(['1::card-details', '2::cvv-iframe', '0::checkout']);
        });

        test('from top frame should cluster down through all levels', async () => {
            const { autofillableFrames, frameForms } = createAutofillScenario(scenarios.DeeplyNestedFrames);
            const dto = { frameId: 0, formId: '0::checkout' } as any;
            const result = await resolveCCFormClusters(autofillableFrames, frameForms, dto);
            expect(formatResults(result)).toEqual(['0::checkout', '1::card-details', '2::cvv-iframe']);
        });
    });

    describe('Scenario: complete nested frame-form', () => {
        test('from complete child frame should return early without parent or siblings', async () => {
            const { autofillableFrames, frameForms } = createAutofillScenario(scenarios.CompleteFormInChildFrame);
            const dto = { frameId: 1, formId: '1::complete-cc-form' } as any;
            const result = await resolveCCFormClusters(autofillableFrames, frameForms, dto);
            expect(formatResults(result)).toEqual(['1::complete-cc-form']);
        });

        test('from empty parent wrapper should include nothing', async () => {
            const { autofillableFrames, frameForms } = createAutofillScenario(scenarios.CompleteFormInChildFrame);
            const dto = { frameId: 0, formId: '0::wrapper' } as any;
            const result = await resolveCCFormClusters(autofillableFrames, frameForms, dto);
            expect(formatResults(result)).toEqual([]);
        });

        test('from unrelated sibling should include nothing', async () => {
            const { autofillableFrames, frameForms } = createAutofillScenario(scenarios.CompleteFormInChildFrame);
            const dto = { frameId: 2, formId: '2::unrelated' } as any;
            const result = await resolveCCFormClusters(autofillableFrames, frameForms, dto);
            expect(formatResults(result)).toEqual([]);
        });
    });

    describe('Scenario: sibling field frames', () => {
        test('from first sibling should discover all siblings', async () => {
            const { autofillableFrames, frameForms } = createAutofillScenario(scenarios.SiblingFramesSameLevel);
            const dto = { frameId: 1, formId: '1::card-number' } as any;
            const result = await resolveCCFormClusters(autofillableFrames, frameForms, dto);
            expect(formatResults(result)).toEqual(['1::card-number', '0::payment', '2::expiry', '3::cvv']);
        });

        test('from middle sibling should cluster all', async () => {
            const { autofillableFrames, frameForms } = createAutofillScenario(scenarios.SiblingFramesSameLevel);
            const dto = { frameId: 2, formId: '2::expiry' } as any;
            const result = await resolveCCFormClusters(autofillableFrames, frameForms, dto);
            expect(formatResults(result)).toEqual(['2::expiry', '0::payment', '1::card-number', '3::cvv']);
        });

        test('from last sibling should cluster all', async () => {
            const { autofillableFrames, frameForms } = createAutofillScenario(scenarios.SiblingFramesSameLevel);
            const dto = { frameId: 3, formId: '3::cvv' } as any;
            const result = await resolveCCFormClusters(autofillableFrames, frameForms, dto);
            expect(formatResults(result)).toEqual(['3::cvv', '0::payment', '1::card-number', '2::expiry']);
        });

        test('from parent should cluster all children', async () => {
            const { autofillableFrames, frameForms } = createAutofillScenario(scenarios.SiblingFramesSameLevel);
            const dto = { frameId: 0, formId: '0::payment' } as any;
            const result = await resolveCCFormClusters(autofillableFrames, frameForms, dto);
            expect(formatResults(result)).toEqual(['0::payment', '1::card-number', '2::expiry', '3::cvv']);
        });
    });

    describe('Scenario: transient frame', () => {
        test('from grandchild should traverse up through formless intermediate', async () => {
            const { autofillableFrames, frameForms } = createAutofillScenario(scenarios.TransientIntermediateFrame);
            const dto = { frameId: 2, formId: '2::card-number' } as any;
            const result = await resolveCCFormClusters(autofillableFrames, frameForms, dto);
            expect(formatResults(result)).toEqual(['2::card-number', '3::expiry-cvv', '0::checkout']);
        });

        test('from other grandchild should cluster through transient frame', async () => {
            const { autofillableFrames, frameForms } = createAutofillScenario(scenarios.TransientIntermediateFrame);
            const dto = { frameId: 3, formId: '3::expiry-cvv' } as any;
            const result = await resolveCCFormClusters(autofillableFrames, frameForms, dto);
            expect(formatResults(result)).toEqual(['3::expiry-cvv', '2::card-number', '0::checkout']);
        });

        test('from top frame should traverse down through transient to grandchildren', async () => {
            const { autofillableFrames, frameForms } = createAutofillScenario(scenarios.TransientIntermediateFrame);
            const dto = { frameId: 0, formId: '0::checkout' } as any;
            const result = await resolveCCFormClusters(autofillableFrames, frameForms, dto);
            expect(formatResults(result)).toEqual(['0::checkout', '2::card-number', '3::expiry-cvv']);
        });
    });

    describe(`Scenario: cluster distancing [MAX_CLUSTER_DISTANCE=${MAX_CLUSTER_DISTANCE}]`, () => {
        test('from top frame should not reach frames beyond max distance', async () => {
            const { autofillableFrames, frameForms } = createAutofillScenario(scenarios.ExceedsMaxClusterDistance);
            const dto = { frameId: 0, formId: '0::top' } as any;
            const result = await resolveCCFormClusters(autofillableFrames, frameForms, dto);

            /** From frame 0, with MAX_CLUSTER_DISTANCE=3:
             * Can reach: 0(d=0) 1(d=1), 2(d=2),
             * Cannot reach:  3(d=3), 4(d=4), 5(d=5) */
            expect(formatResults(result)).toEqual(['0::top', '1::level-1', '2::level-2']);
        });

        test('from middle frame should respect distance limit in both directions', async () => {
            const { autofillableFrames, frameForms } = createAutofillScenario(scenarios.ExceedsMaxClusterDistance);
            const dto = { frameId: 2, formId: '2::level-2' } as any;
            const result = await resolveCCFormClusters(autofillableFrames, frameForms, dto);

            /** From frame 2, with MAX_CLUSTER_DISTANCE=3:
             * Can reach: 0(d=-2), 1(d=-1), 3(d=1), 4(d=2)
             * Cannot reach: 5(d=3)
             * NOTE: form is complete without needing to walk-up */
            expect(formatResults(result)).toEqual(['2::level-2', '3::level-3', '4::level-4', '1::level-1']);
        });

        test('from deep frame should not reach back beyond max distance', async () => {
            const { autofillableFrames, frameForms } = createAutofillScenario(scenarios.ExceedsMaxClusterDistance);
            const dto = { frameId: 4, formId: '4::level-4' } as any;
            const result = await resolveCCFormClusters(autofillableFrames, frameForms, dto);

            /** From frame 4, with MAX_CLUSTER_DISTANCE=3:
             * Can reach: 2(d=-2), 3(d=-1), 5(d=1)
             * Cannot reach: 0(d=-4), 1(d=-3) */
            expect(formatResults(result)).toEqual(['4::level-4', '5::level-5', '3::level-3', '2::level-2']);
        });

        test('from deepest frame should not reach top frame if beyond max distance', async () => {
            const { autofillableFrames, frameForms } = createAutofillScenario(scenarios.ExceedsMaxClusterDistance);
            const dto = { frameId: 5, formId: '5::level-5' } as any;
            const result = await resolveCCFormClusters(autofillableFrames, frameForms, dto);

            /** From frame 5, with MAX_CLUSTER_DISTANCE=3:
             * Can reach: 3(d=-2), 4(d=-1)
             * Cannot reach: 0(d=-5), 1(d=-4), 2(d=-3), */
            expect(formatResults(result)).toEqual(['5::level-5', '4::level-4', '3::level-3']);
        });

        test('from frame at exact max distance should include boundary frames', async () => {
            const { autofillableFrames, frameForms } = createAutofillScenario(scenarios.ExceedsMaxClusterDistance);
            const dto = { frameId: 3, formId: '3::level-3' } as any;
            const result = await resolveCCFormClusters(autofillableFrames, frameForms, dto);

            /** From frame 3: everything is reachable
             * NOTE: form is complete without needing to walk-up */
            expect(formatResults(result)).toEqual([
                '3::level-3',
                '4::level-4',
                '5::level-5',
                '2::level-2',
                '1::level-1',
            ]);
        });
    });
});
