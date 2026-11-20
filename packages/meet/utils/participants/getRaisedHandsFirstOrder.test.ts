import { describe, expect, it } from 'vitest';

import { getRaisedHandsFirstOrder } from './getRaisedHandsFirstOrder';

const order = ['local', 'A', 'B', 'C', 'D'];

describe('getRaisedHandsFirstOrder', () => {
    it('keeps the order unchanged when no hand is raised', () => {
        expect(getRaisedHandsFirstOrder({ order, raisedHands: [] })).toEqual(['local', 'A', 'B', 'C', 'D']);
    });

    it('puts raised hands first, earliest raise first', () => {
        expect(getRaisedHandsFirstOrder({ order, raisedHands: ['A', 'C', 'B'] })).toEqual([
            'A',
            'C',
            'B',
            'local',
            'D',
        ]);
    });

    it('places a new raise after everyone who raised earlier', () => {
        expect(getRaisedHandsFirstOrder({ order, raisedHands: ['C'] })).toEqual(['C', 'local', 'A', 'B', 'D']);
        expect(getRaisedHandsFirstOrder({ order, raisedHands: ['C', 'A'] })).toEqual(['C', 'A', 'local', 'B', 'D']);
    });

    it('returns a participant who lowers their hand to their position without a raised hand', () => {
        expect(getRaisedHandsFirstOrder({ order, raisedHands: ['C', 'B'] })).toEqual(['C', 'B', 'local', 'A', 'D']);
        expect(getRaisedHandsFirstOrder({ order, raisedHands: ['C'] })).toEqual(['C', 'local', 'A', 'B', 'D']);
    });

    it('keeps the relative order of participants without a raised hand', () => {
        expect(getRaisedHandsFirstOrder({ order, raisedHands: ['D', 'A'] })).toEqual(['D', 'A', 'local', 'B', 'C']);
    });

    it('includes the local participant when they raise their hand', () => {
        expect(getRaisedHandsFirstOrder({ order, raisedHands: ['B', 'local'] })).toEqual(['B', 'local', 'A', 'C', 'D']);
    });

    it('drops raised hands of identities that are not in the order', () => {
        expect(getRaisedHandsFirstOrder({ order, raisedHands: ['ghost', 'C'] })).toEqual(['C', 'local', 'A', 'B', 'D']);
    });
});
