import folder from '../../fixtures/folder';
import v1StartsEndsTest from '../../fixtures/v1StartsEndsTest';
import v2 from '../../fixtures/v2';
import v2Attachments from '../../fixtures/v2Attachments';
import v2Complex from '../../fixtures/v2Complex';
import v2EscapeVariables from '../../fixtures/v2EscapeVariables';
import v2From from '../../fixtures/v2From';
import v2InvalidStructure from '../../fixtures/v2InvalidStructure';
import v2SpamOnly from '../../fixtures/v2SpamOnly';
import v2StartsEndsTest from '../../fixtures/v2StartsEndsTest';
import v2Vacation from '../../fixtures/v2Vacation';
import v2VacationDouble from '../../fixtures/v2VacationDouble';
import v2VariableManyConditionsComplex from '../../fixtures/v2VariableManyConditionsComplex';
import { fromSieveTree } from './fromSieveTree';

describe('To Tree testing', () => {
    it('fromSieveTree - Should match simple test', () => {
        const { simple, tree } = folder;
        const generated = fromSieveTree(tree);
        expect(generated).toEqual(simple);
    });

    it('fromSieveTree - Should match on v2', () => {
        const { simple, tree } = v2;
        const generated = fromSieveTree(tree);
        expect(generated).toEqual(simple);
    });

    it('fromSieveTree - Should match on v1 with tree', () => {
        const { simple, tree } = v1StartsEndsTest;
        const generated = fromSieveTree(tree);
        expect(generated).toEqual(simple);
    });

    it('fromSieveTree - Should match on v2 with tree', () => {
        const { simple, tree } = v2StartsEndsTest;
        const generated = fromSieveTree(tree);
        expect(generated).toEqual(simple);
    });

    it('fromSieveTree - Should match on v2 with attachments', () => {
        const { simple, tree } = v2Attachments;
        const generated = fromSieveTree(tree);
        expect(generated).toEqual(simple);
    });

    it('fromSieveTree - Should match on v2 with vacation', () => {
        const { simple, tree } = v2Vacation;
        const generated = fromSieveTree(tree);
        expect(generated).toEqual(simple);
    });

    it('fromSieveTree - Should match on v2 with from', () => {
        const { simple, tree } = v2From;
        const generated = fromSieveTree(tree);
        expect(generated).toEqual(simple);
    });

    it('fromSieveTree - Should match on v2 with complex', () => {
        const { simple, tree } = v2Complex;
        const generated = fromSieveTree(tree);
        expect(generated).toEqual(simple);
    });

    it('fromSieveTree - Should match on v2 with vacation double', () => {
        const { simple, tree } = v2VacationDouble;
        const generated = fromSieveTree(tree);
        expect(generated).toEqual(simple);
    });

    it('fromSieveTree - Should match on v2 with complex with many conditions and variables', () => {
        const { simple, tree } = v2VariableManyConditionsComplex;
        const generated = fromSieveTree(tree);
        expect(generated).toEqual(simple);
    });

    it('fromSieveTree - Should match on v2 with escape variables', () => {
        const { simple, tree } = v2EscapeVariables;
        const generated = fromSieveTree(tree);
        expect(generated).toEqual(simple);
    });

    it('fromSieveTree - Should error on invalid tree', () => {
        const { simple, tree } = v2InvalidStructure;
        const generated = fromSieveTree(tree);
        expect(generated).toEqual(simple);
    });

    it('fromSieveTree - Should match on v2 with spam only folder', () => {
        const { simple, tree } = v2SpamOnly;
        const generated = fromSieveTree(tree);
        expect(generated).toEqual(simple);
    });
});
