import { describe, expect, it } from 'vitest';

import { getVisuallyStableSortedParticipants } from './getVisuallyStableSortedParticipants';

const cases = [
    {
        name: 'should return ideal order when there is no previous order',
        idealOrder: ['local', 'A', 'B', 'C'],
        previousOrder: [],
        pageSize: 4,
        selfView: false,
        expected: ['local', 'A', 'B', 'C'],
    },
    {
        name: 'should not change order when all participants fit on one page',
        idealOrder: ['local', 'B', 'A', 'C'],
        previousOrder: ['local', 'A', 'B', 'C'],
        pageSize: 5,
        selfView: false,
        expected: ['local', 'A', 'B', 'C'],
    },
    {
        name: 'should not rearrange participants if already in ideal order',
        idealOrder: [
            // first page
            'local',
            'A',
            'B',
            'C',
            // second page
            'D',
            'E',
        ],
        previousOrder: [
            // first page
            'local',
            'A',
            'B',
            'C',
            // second page
            'D',
            'E',
        ],
        pageSize: 4,
        selfView: false,
        expected: [
            // first page
            'local',
            'A',
            'B',
            'C',
            // second page
            'D',
            'E',
        ],
    },
    {
        name: 'should not rearrange if each page already has the correct participants',
        idealOrder: [
            // first page
            'local',
            'C',
            'A',
            'B',
            // second page
            'D',
            'E',
        ],
        previousOrder: [
            // first page
            'local',
            'A',
            'B',
            'C',
            // second page
            'D',
            'E',
        ],
        pageSize: 4,
        selfView: false,
        expected: [
            // first page (same participants, stable order preserved)
            'local',
            'A',
            'B',
            'C',
            // second page
            'D',
            'E',
        ],
    },
    {
        name: 'should remove participants who left',
        idealOrder: ['local', 'A', 'C'],
        previousOrder: ['local', 'A', 'B', 'C'],
        pageSize: 4,
        selfView: false,
        expected: ['local', 'A', 'C'],
    },
    {
        name: 'should append new participants who joined',
        idealOrder: ['local', 'A', 'B', 'C'],
        previousOrder: ['local', 'A', 'B'],
        pageSize: 4,
        selfView: false,
        expected: ['local', 'A', 'B', 'C'],
    },
    {
        name: 'should bring a participant forward if they are not on the right page',
        idealOrder: [
            // first page
            'local',
            'E',
            'A',
            'B',
            // second page
            'C',
            'D',
        ],
        previousOrder: [
            // first page
            'local',
            'A',
            'B',
            'C',
            // second page
            'D',
            'E',
        ],
        pageSize: 4,
        selfView: false,
        expected: [
            // first page (E swapped in for D, keeping stable positions)
            'local',
            'A',
            'B',
            'C',
            // second page
            'E',
            'D',
        ],
    },
    {
        name: 'should not reorder within a page even if ideal intra-page order differs',
        idealOrder: [
            // first page (same participants, different order)
            'local',
            'D',
            'B',
            'C',
            // second page
            'A',
            'E',
        ],
        previousOrder: [
            // first page
            'local',
            'A',
            'B',
            'C',
            // second page
            'D',
            'E',
        ],
        pageSize: 4,
        selfView: false,
        expected: [
            // first page (order preserved since same participants are on the page)
            'local',
            'A',
            'B',
            'C',
            // second page
            'D',
            'E',
        ],
    },
    {
        name: 'should swap participants between pages to match ideal page assignment',
        idealOrder: [
            // first page
            'local',
            'E',
            'A',
            'D',
            // second page
            'B',
            'C',
        ],
        previousOrder: [
            // first page
            'local',
            'A',
            'B',
            'C',
            // second page
            'D',
            'E',
        ],
        pageSize: 4,
        selfView: false,
        expected: [
            // first page (E and D swapped in for B and C)
            'local',
            'A',
            'B',
            'E',
            // second page
            'D',
            'C',
        ],
    },
    {
        name: 'should handle multiple simultaneous swaps between pages',
        idealOrder: [
            // first page
            'local',
            'D',
            'E',
            'F',
            // second page
            'A',
            'B',
            'C',
        ],
        previousOrder: [
            // first page
            'local',
            'A',
            'B',
            'C',
            // second page
            'D',
            'E',
            'F',
        ],
        pageSize: 4,
        selfView: false,
        expected: [
            // first page (E and F swapped in for B and C)
            'local',
            'A',
            'E',
            'F',
            // second page
            'D',
            'B',
            'C',
        ],
    },
    {
        name: 'should handle a single participant',
        idealOrder: ['local'],
        previousOrder: ['local'],
        pageSize: 4,
        selfView: false,
        expected: ['local'],
    },
    {
        name: 'should handle empty ideal order',
        idealOrder: [],
        previousOrder: ['local', 'A', 'B'],
        pageSize: 4,
        selfView: false,
        expected: [],
    },
    {
        name: 'selfView: should return ideal order when there is no previous order',
        idealOrder: ['local', 'A', 'B', 'C'],
        previousOrder: [],
        pageSize: 4,
        selfView: true,
        expected: ['local', 'A', 'B', 'C'],
    },
    {
        name: 'selfView: local is part of pagination so page boundaries shift',
        idealOrder: ['local', 'A', 'B', 'C', 'D'],
        previousOrder: ['local', 'A', 'B', 'D', 'C'],
        pageSize: 3,
        selfView: true,
        // page 0 = [local, A, B], page 1 = [D, C]
        // both pages already have the correct participants → no swap
        expected: ['local', 'A', 'B', 'D', 'C'],
    },
    {
        name: 'selfView=false with same inputs produces a swap due to different page boundaries',
        idealOrder: ['local', 'A', 'B', 'C', 'D'],
        previousOrder: ['local', 'A', 'B', 'D', 'C'],
        pageSize: 3,
        selfView: false,
        // page 0 = [A, B, D], page 1 = [C]
        // ideal page 0 = [A, B, C], ideal page 1 = [D] → C and D swap
        expected: ['local', 'A', 'B', 'C', 'D'],
    },
    {
        name: 'selfView: swaps a different participant compared to selfView=false',
        idealOrder: [
            // first page
            'local',
            'E',
            'A',
            'B',
            // second page
            'C',
            'D',
        ],
        previousOrder: [
            // first page
            'local',
            'A',
            'B',
            'C',
            // second page
            'D',
            'E',
        ],
        pageSize: 4,
        selfView: true,
        // With selfView=true, page 0 = [local, A, B, C], page 1 = [D, E]
        // ideal page 0 = [local, E, A, B] → C swaps out, E swaps in
        expected: ['local', 'A', 'B', 'E', 'D', 'C'],
    },
];

describe('getVisuallyStableSortedParticipants', () => {
    cases.forEach(({ name, idealOrder, previousOrder, pageSize, selfView, expected }) => {
        it(name, () => {
            const result = getVisuallyStableSortedParticipants({
                idealOrder,
                previousOrder,
                pageSize,
                selfView,
            });
            expect(result).toEqual(expected);
        });
    });
});
