import type { ClusterFrame } from 'proton-pass-extension/app/worker/services/autofill.cc';
import { clusterCCFormFields } from 'proton-pass-extension/app/worker/services/autofill.cc';
import type { AutofillableFrame } from 'proton-pass-extension/lib/utils/frames';
import type { AutofillActionDTO } from 'proton-pass-extension/types/autofill';

import { default as json } from './autofill.cc.samples.json';

type SerializedMap<T> = Record<string, T>;
type JsonSamples = Record<string, { frames: SerializedMap<AutofillableFrame>; clusters: SerializedMap<ClusterFrame> }>;

const parseMap = <T>(json: SerializedMap<T>): Map<number, T> =>
    new Map<number, T>(Object.entries(json).map(([frameId, frame]) => [parseInt(frameId, 10), frame]));

const samples = Object.fromEntries(
    Object.entries(json as JsonSamples).map(([key, { frames, clusters }]) => [
        key,
        { frames: parseMap(frames), clusters: parseMap(clusters) },
    ])
);

describe('CC form clustering', () => {
    describe('sanity checks', () => {
        const { frames, clusters } = samples['adobe.com'];

        test('should noop on unknown `fieldId`', () => {
            const payload = { frameId: 708, formId: '32fe822a', fieldId: 'unknown' } as AutofillActionDTO;
            const result = clusterCCFormFields(frames, clusters, payload);
            expect(result).toEqual(new Map());
        });

        test('should noop on unknown `formId`', () => {
            const payload = { frameId: 708, formId: 'unknown', fieldId: '8d885283' } as AutofillActionDTO;
            const result = clusterCCFormFields(frames, clusters, payload);
            expect(result).toEqual(new Map());
        });

        test('should noop on unknown `frameId`', () => {
            const payload = { frameId: 83, formId: '32fe822a', fieldId: '8d885283' } as AutofillActionDTO;
            const result = clusterCCFormFields(frames, clusters, payload);
            expect(result).toEqual(new Map());
        });
    });

    describe('autofilth.lol > payment form', () => {
        const { frames, clusters } = samples['autofilth.lol/payment'];

        test('resolves from cc-number', () => {
            const payload = { frameId: 838, formId: '93546be1', fieldId: 'eb10e9d1' } as AutofillActionDTO;
            const result = clusterCCFormFields(frames, clusters, payload);
            expect(result).toEqual(
                new Map([
                    [
                        838,
                        [
                            { fieldId: 'eb10e9d1', formId: '93546be1', frameId: 838 },
                            { fieldId: '3c4c82c6', formId: '93546be1', frameId: 838 },
                            { fieldId: 'eb316378', formId: '93546be1', frameId: 838 },
                            { fieldId: '32336fd7', formId: '93546be1', frameId: 838 },
                        ],
                    ],
                ])
            );
        });
    });

    describe('autofilth.lol > checkout form', () => {
        const { frames, clusters } = samples['autofilth.lol/checkout'];

        test('resolves from cc-name in top-frame', () => {
            const payload = { frameId: 0, formId: '2fa1a751', fieldId: 'bda56c58' } as AutofillActionDTO;
            const result = clusterCCFormFields(frames, clusters, payload);
            expect(result).toEqual(
                new Map([
                    [0, [{ fieldId: 'bda56c58', frameId: 0, formId: '2fa1a751' }]],
                    [
                        841,
                        [
                            { fieldId: '8bb4e5da', frameId: 841, formId: '1c8b65b2' },
                            { fieldId: '217c7b4e', frameId: 841, formId: '1c8b65b2' },
                            { fieldId: '2c3e3b8b', frameId: 841, formId: '1c8b65b2' },
                        ],
                    ],
                ])
            );
        });

        test('resolves from cc-number in sub-frame', () => {
            const payload = { frameId: 841, formId: '1c8b65b2', fieldId: '8bb4e5da' } as AutofillActionDTO;
            const result = clusterCCFormFields(frames, clusters, payload);
            expect(result).toEqual(
                new Map([
                    [0, [{ fieldId: 'bda56c58', frameId: 0, formId: '2fa1a751' }]],
                    [
                        841,
                        [
                            { fieldId: '8bb4e5da', frameId: 841, formId: '1c8b65b2' },
                            { fieldId: '217c7b4e', frameId: 841, formId: '1c8b65b2' },
                            { fieldId: '2c3e3b8b', frameId: 841, formId: '1c8b65b2' },
                        ],
                    ],
                ])
            );
        });
    });

    describe('adobe.com > payment form', () => {
        const { frames, clusters } = samples['adobe.com'];

        test('resolves from cc-number', () => {
            const payload = { frameId: 708, formId: '32fe822a', fieldId: '8d885283' } as AutofillActionDTO;
            const result = clusterCCFormFields(frames, clusters, payload);

            expect(result).toEqual(
                new Map([
                    [
                        708,
                        [
                            { fieldId: '8d885283', frameId: 708, formId: '32fe822a' },
                            { fieldId: '29f0aad5', frameId: 708, formId: '32fe822a' },
                        ],
                    ],
                ])
            );
        });

        test('resolves from cc-exp', () => {
            const payload = { frameId: 708, formId: '32fe822a', fieldId: '29f0aad5' } as AutofillActionDTO;
            const result = clusterCCFormFields(frames, clusters, payload);

            expect(result).toEqual(
                new Map([
                    [
                        708,
                        [
                            { fieldId: '8d885283', frameId: 708, formId: '32fe822a' },
                            { fieldId: '29f0aad5', frameId: 708, formId: '32fe822a' },
                        ],
                    ],
                ])
            );
        });
    });

    describe('wish.com > payment form', () => {
        const { frames, clusters } = samples['wish.com'];

        test('resolves from cc-number', () => {
            const payload = { frameId: 616, formId: 'd6d9fe4a', fieldId: 'bef6683a' } as AutofillActionDTO;
            const result = clusterCCFormFields(frames, clusters, payload);
            expect(result).toEqual(
                new Map([
                    [
                        616,
                        [
                            { fieldId: 'bef6683a', frameId: 616, formId: 'd6d9fe4a' },
                            { fieldId: '8899fdbe', frameId: 616, formId: 'd6d9fe4a' },
                            { fieldId: '1850802a', frameId: 616, formId: 'd6d9fe4a' },
                        ],
                    ],
                ])
            );
        });

        test('resolves from cc-exp', () => {
            const payload = { frameId: 616, formId: 'd6d9fe4a', fieldId: '8899fdbe' } as AutofillActionDTO;
            const result = clusterCCFormFields(frames, clusters, payload);
            expect(result).toEqual(
                new Map([
                    [
                        616,
                        [
                            { fieldId: 'bef6683a', frameId: 616, formId: 'd6d9fe4a' },
                            { fieldId: '8899fdbe', frameId: 616, formId: 'd6d9fe4a' },
                            { fieldId: '1850802a', frameId: 616, formId: 'd6d9fe4a' },
                        ],
                    ],
                ])
            );
        });
    });

    describe('ikea.com/gift-card > payment form', () => {
        const { frames, clusters } = samples['ikea.com/gift-card'];

        test('resolves from cc-exp', () => {
            const payload = { frameId: 0, formId: '15726986', fieldId: 'd23050eb' } as AutofillActionDTO;
            const result = clusterCCFormFields(frames, clusters, payload);
            expect(result).toEqual(
                new Map([
                    [
                        0,
                        [
                            { fieldId: 'd23050eb', frameId: 0, formId: '15726986' },
                            { fieldId: '5144cf49', frameId: 0, formId: '15726986' },
                        ],
                    ],
                ])
            );
        });

        test('resolves from cc-name', () => {
            const payload = { frameId: 0, formId: '15726986', fieldId: '5144cf49' } as AutofillActionDTO;
            const result = clusterCCFormFields(frames, clusters, payload);
            expect(result).toEqual(
                new Map([
                    [
                        0,
                        [
                            { fieldId: 'd23050eb', frameId: 0, formId: '15726986' },
                            { fieldId: '5144cf49', frameId: 0, formId: '15726986' },
                        ],
                    ],
                ])
            );
        });

        test('resolves from cc-number in separate form', () => {
            const payload = { frameId: 0, formId: '867a6a75', fieldId: '9f613269' } as AutofillActionDTO;
            const result = clusterCCFormFields(frames, clusters, payload);
            expect(result).toEqual(new Map([[0, [{ fieldId: '9f613269', frameId: 0, formId: '867a6a75' }]]]));
        });
    });

    describe('ikea.com/checkout > payment form', () => {
        const { frames, clusters } = samples['ikea.com/checkout'];

        test('resolves from cc-exp in main frame', () => {
            const payload = { frameId: 0, formId: '15726986', fieldId: 'd23050eb' } as AutofillActionDTO;
            const result = clusterCCFormFields(frames, clusters, payload);
            expect(result).toEqual(
                new Map([
                    [
                        0,
                        [
                            { fieldId: 'd23050eb', frameId: 0, formId: '15726986' },
                            { fieldId: '5144cf49', frameId: 0, formId: '15726986' },
                        ],
                    ],
                    [861, [{ fieldId: '29fbb4b2', frameId: 861, formId: '1b2c9925' }]],
                    [862, [{ fieldId: 'd1bc98be', frameId: 862, formId: '4e22babb' }]],
                ])
            );
        });

        test('resolves from cc-number in sub-frame', () => {
            const payload = { frameId: 861, formId: '1b2c9925', fieldId: '29fbb4b2' } as AutofillActionDTO;
            const result = clusterCCFormFields(frames, clusters, payload);
            expect(result).toEqual(
                new Map([
                    [
                        0,
                        [
                            { fieldId: 'd23050eb', frameId: 0, formId: '15726986' },
                            { fieldId: '5144cf49', frameId: 0, formId: '15726986' },
                        ],
                    ],
                    [861, [{ fieldId: '29fbb4b2', frameId: 861, formId: '1b2c9925' }]],
                    [862, [{ fieldId: 'd1bc98be', frameId: 862, formId: '4e22babb' }]],
                ])
            );
        });
    });

    describe('etos.com > payment form', () => {
        const { frames, clusters } = samples['etos.com'];

        test('resolves from cc-name in main frame', () => {
            const payload = { frameId: 0, formId: 'c0f9b5b8', fieldId: 'e1b718ce' } as AutofillActionDTO;
            const result = clusterCCFormFields(frames, clusters, payload);
            expect(result).toEqual(
                new Map([
                    [0, [{ fieldId: 'e1b718ce', frameId: 0, formId: 'c0f9b5b8' }]],
                    [472, [{ fieldId: 'fd17f733', frameId: 472, formId: '13b37f22' }]],
                    [473, [{ fieldId: '7426de9c', frameId: 473, formId: 'a215f770' }]],
                    [474, [{ fieldId: 'd99c1644', frameId: 474, formId: 'da74cc1e' }]],
                ])
            );
        });

        test('resolves from cc-number in sub-frame', () => {
            const payload = { frameId: 472, formId: '13b37f22', fieldId: 'fd17f733' } as AutofillActionDTO;
            const result = clusterCCFormFields(frames, clusters, payload);
            expect(result).toEqual(
                new Map([
                    [0, [{ fieldId: 'e1b718ce', frameId: 0, formId: 'c0f9b5b8' }]],
                    [472, [{ fieldId: 'fd17f733', frameId: 472, formId: '13b37f22' }]],
                    [473, [{ fieldId: '7426de9c', frameId: 473, formId: 'a215f770' }]],
                    [474, [{ fieldId: 'd99c1644', frameId: 474, formId: 'da74cc1e' }]],
                ])
            );
        });
    });

    describe('decathlon.es > payment and gift-card forms', () => {
        const { frames, clusters } = samples['decathlon.es'];

        test('resolves from cc-number in gift-card form', () => {
            const payload = { frameId: 0, formId: 'a6cf3634', fieldId: '977ecff9' } as AutofillActionDTO;
            const result = clusterCCFormFields(frames, clusters, payload);
            expect(result).toEqual(
                new Map([
                    [
                        0,
                        [
                            { fieldId: '977ecff9', frameId: 0, formId: 'a6cf3634' },
                            { fieldId: '45a6aebd', frameId: 0, formId: 'a6cf3634' },
                        ],
                    ],
                ])
            );
        });

        test('resolves from cc-name in payment form with iframes', () => {
            const payload = { frameId: 0, formId: 'c828b47d', fieldId: '1e5e4645' } as AutofillActionDTO;
            const result = clusterCCFormFields(frames, clusters, payload);
            expect(result).toEqual(
                new Map([
                    [0, [{ fieldId: '1e5e4645', frameId: 0, formId: 'c828b47d' }]],
                    [871, [{ fieldId: '3a7d16cb', frameId: 871, formId: '45899854' }]],
                    [872, [{ fieldId: '532687bd', frameId: 872, formId: 'd8a53da1' }]],
                    [873, [{ fieldId: '328035e2', frameId: 873, formId: '9b42bb8c' }]],
                ])
            );
        });

        test('resolves from cc-number in payment form sub-frame', () => {
            const payload = { frameId: 871, formId: '45899854', fieldId: '3a7d16cb' } as AutofillActionDTO;
            const result = clusterCCFormFields(frames, clusters, payload);
            expect(result).toEqual(
                new Map([
                    [0, [{ fieldId: '1e5e4645', frameId: 0, formId: 'c828b47d' }]],
                    [871, [{ fieldId: '3a7d16cb', frameId: 871, formId: '45899854' }]],
                    [872, [{ fieldId: '532687bd', frameId: 872, formId: 'd8a53da1' }]],
                    [873, [{ fieldId: '328035e2', frameId: 873, formId: '9b42bb8c' }]],
                ])
            );
        });
    });

    describe('rituals.com/gift-card > payment form', () => {
        const { frames, clusters } = samples['rituals.com/gift-card'];

        test('resolves from cc-number', () => {
            const payload = { frameId: 0, formId: 'd638e23a', fieldId: 'a6747091' } as AutofillActionDTO;
            const result = clusterCCFormFields(frames, clusters, payload);
            expect(result).toEqual(
                new Map([
                    [
                        0,
                        [
                            { fieldId: 'a6747091', frameId: 0, formId: 'd638e23a' },
                            { fieldId: 'e2b863e7', frameId: 0, formId: 'd638e23a' },
                        ],
                    ],
                ])
            );
        });

        test('resolves from cc-cvc', () => {
            const payload = { frameId: 0, formId: 'd638e23a', fieldId: 'e2b863e7' } as AutofillActionDTO;
            const result = clusterCCFormFields(frames, clusters, payload);
            expect(result).toEqual(
                new Map([
                    [
                        0,
                        [
                            { fieldId: 'a6747091', frameId: 0, formId: 'd638e23a' },
                            { fieldId: 'e2b863e7', frameId: 0, formId: 'd638e23a' },
                        ],
                    ],
                ])
            );
        });
    });

    describe('rituals.com/payment > payment form', () => {
        const { frames, clusters } = samples['rituals.com/payment'];

        test('resolves from cc-name in main frame', () => {
            const payload = { frameId: 0, formId: 'd638e23a', fieldId: '1a1623f3' } as AutofillActionDTO;
            const result = clusterCCFormFields(frames, clusters, payload);
            expect(result).toEqual(
                new Map([
                    [0, [{ fieldId: '1a1623f3', frameId: 0, formId: 'd638e23a' }]],
                    [898, [{ fieldId: 'fad289ca', frameId: 898, formId: '19aa4710' }]],
                    [899, [{ fieldId: 'a57e8d2d', frameId: 899, formId: '6c66189e' }]],
                    [900, [{ fieldId: 'b4c59d5f', frameId: 900, formId: '27255072' }]],
                ])
            );
        });

        test('resolves from cc-number in sub-frame', () => {
            const payload = { frameId: 898, formId: '19aa4710', fieldId: 'fad289ca' } as AutofillActionDTO;
            const result = clusterCCFormFields(frames, clusters, payload);
            expect(result).toEqual(
                new Map([
                    [0, [{ fieldId: '1a1623f3', frameId: 0, formId: 'd638e23a' }]],
                    [898, [{ fieldId: 'fad289ca', frameId: 898, formId: '19aa4710' }]],
                    [899, [{ fieldId: 'a57e8d2d', frameId: 899, formId: '6c66189e' }]],
                    [900, [{ fieldId: 'b4c59d5f', frameId: 900, formId: '27255072' }]],
                ])
            );
        });

        test('resolves from cc-exp in sub-frame', () => {
            const payload = { frameId: 899, formId: '6c66189e', fieldId: 'a57e8d2d' } as AutofillActionDTO;
            const result = clusterCCFormFields(frames, clusters, payload);
            expect(result).toEqual(
                new Map([
                    [0, [{ fieldId: '1a1623f3', frameId: 0, formId: 'd638e23a' }]],
                    [898, [{ fieldId: 'fad289ca', frameId: 898, formId: '19aa4710' }]],
                    [899, [{ fieldId: 'a57e8d2d', frameId: 899, formId: '6c66189e' }]],
                    [900, [{ fieldId: 'b4c59d5f', frameId: 900, formId: '27255072' }]],
                ])
            );
        });
    });
});
