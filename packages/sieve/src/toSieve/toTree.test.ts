import archive from '../../fixtures/archive';
import folder from '../../fixtures/folder';
import v1StartsEndsTest from '../../fixtures/v1StartsEndsTest';
import v2 from '../../fixtures/v2';
import v2Attachments from '../../fixtures/v2Attachments';
import v2Complex from '../../fixtures/v2Complex';
import v2EscapeVariables from '../../fixtures/v2EscapeVariables';
import v2From from '../../fixtures/v2From';
import v2StartsEndsTest from '../../fixtures/v2StartsEndsTest';
import v2Vacation from '../../fixtures/v2Vacation';
import { toSieveTree } from './toSieveTree';

describe('To Tree testing', () => {
    it('toSieveTree - Should match simple test', () => {
        const { simple, tree } = archive;
        const generated = toSieveTree(simple, 1);
        expect(generated).toEqual(tree);
    });

    it('toSieveTree - Should match on folders mapping', () => {
        const { simple, tree } = folder;
        const generated = toSieveTree(simple, 1);
        expect(generated).toEqual(tree);
    });

    it('toSieveTree - Should match on v2', () => {
        const { simple, tree } = v2;
        const generated = toSieveTree(simple, 2);
        expect(generated).toEqual(tree);
    });

    it('toSieveTree - Should match on v1 with tree', () => {
        const { simple, tree } = v1StartsEndsTest;
        const generated = toSieveTree(simple, 1);
        expect(generated).toEqual(tree);
    });

    it('toSieveTree - Should match on v2 with tree', () => {
        const { simple, tree } = v2StartsEndsTest;
        const generated = toSieveTree(simple, 2);
        expect(generated).toEqual(tree);
    });

    it('toSieveTree - Should match on v2 with attachments', () => {
        const { simple, tree } = v2Attachments;
        const generated = toSieveTree(simple, 2);
        expect(generated).toEqual(tree);
    });

    it('toSieveTree - Should match on v2 with vacation', () => {
        const { simple, tree } = v2Vacation;
        const generated = toSieveTree(simple, 2);
        expect(generated).toEqual(tree);
    });

    it('toSieveTree - Should match on v2 with from', () => {
        const { simple, tree } = v2From;
        const generated = toSieveTree(simple, 2);
        expect(generated).toEqual(tree);
    });

    it('toSieveTree - Should match on v2 with complex', () => {
        const { simple, tree } = v2Complex;
        const generated = toSieveTree(simple, 2);
        expect(generated).toEqual(tree);
    });

    it('toSieveTree - Should match on v2 with escape variables', () => {
        const { simple, tree } = v2EscapeVariables;
        const generated = toSieveTree(simple, 2);
        expect(generated).toEqual(tree);
    });
});
