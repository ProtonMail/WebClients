import { createFilterDefinition } from '../skills/filters/createFilter';
import { updateFilterDefinition } from '../skills/filters/updateFilter';
import { PROTON_SIEVE_DIALECT_REFERENCE, SIEVE_SPAM_GUARD } from './sieveGuide';

const exampleScripts = [createFilterDefinition, updateFilterDefinition].flatMap(({ name, examples = [] }) =>
    examples.map(({ call }, index) => [`${name} example ${index}`, call.sieve] as const)
);

/**
 * The guard is kept as a literal in each example so a reviewer reads the exact script the model is shown.
 * These pin that copying against the one definition — an edit in either place, or a stray escape in the
 * template literal the guide is built from, reddens here instead of silently teaching a broken guard.
 */
describe('the spam guard is identical everywhere it is shown', () => {
    it.each(exampleScripts)('%s carries it verbatim', (_case, sieve) => {
        expect(sieve).toContain(SIEVE_SPAM_GUARD);
    });

    it('appears in the guide both as the mandatory prologue and in the worked example', () => {
        expect(PROTON_SIEVE_DIALECT_REFERENCE.split(SIEVE_SPAM_GUARD)).toHaveLength(3);
    });

    // The guide is a template literal, so an unescaped `${1}` would interpolate away to nothing.
    it('keeps the threshold placeholder literal', () => {
        expect(SIEVE_SPAM_GUARD).toContain('"${1}"');
    });
});
