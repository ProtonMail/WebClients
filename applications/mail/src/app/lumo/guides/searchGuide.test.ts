import { indexedESStatus } from '../helpers/navigation.test.helpers';
import { buildMailSearchGuide } from './searchGuide';

const SUBSTRING_CLAIM = 'There is no OR, and no operators of any kind.';
const OPERATOR_CLAIM = '`hello | world` — OR';

describe('buildMailSearchGuide', () => {
    it('teaches substring matching when Encrypted Search will run the query', () => {
        const guide = buildMailSearchGuide(indexedESStatus());

        expect(guide).toContain(SUBSTRING_CLAIM);
        expect(guide).not.toContain(OPERATOR_CLAIM);
    });

    it.each([
        ['no index on this device', { dbExists: false }],
        ['the user switched it off', { esEnabled: false }],
    ])('teaches the server operator syntax when %s', (_case, esStatus) => {
        const guide = buildMailSearchGuide(indexedESStatus(esStatus));

        expect(guide).toContain(OPERATOR_CLAIM);
        expect(guide).not.toContain(SUBSTRING_CLAIM);
    });

    // The syntax regime turns only on who parses the keyword. A metadata-only index still normalises it,
    // so operators stay literal — unlike coverage, which also weighs contentIndexingDone/isDBLimited.
    it('keeps substring rules while content indexing is unfinished, since ES still parses the keyword', () => {
        expect(buildMailSearchGuide(indexedESStatus({ contentIndexingDone: false, isDBLimited: true }))).toContain(
            SUBSTRING_CLAIM
        );
    });

    // book -> booking holds under ES and is false against the server, which matches whole tokens.
    it('reverses the short-stem advice on the operator path', () => {
        expect(buildMailSearchGuide(indexedESStatus())).toContain('a short stem catches more');
        expect(buildMailSearchGuide(indexedESStatus({ esEnabled: false }))).toContain(
            'Matching is by whole TOKEN, not by substring'
        );
    });

    it('scopes each operator claim to the engine, so neither variant contradicts the other', () => {
        expect(buildMailSearchGuide(indexedESStatus())).toContain('do nothing here');
        expect(buildMailSearchGuide(indexedESStatus({ esEnabled: false }))).toContain('METADATA ONLY');
    });

    it.each([
        ['a subject line is not an answer', 'A subject line is not an answer'],
        ['contents come only from read_email', 'will never surface a body'],
        ['a disconfirming read sends you back', 'go back and search again with what you just learned'],
        ['a truncated page is not a conclusion', '12 of 340 emails shown'],
        ['an empty result is not a dead end', 'never a reason to stop after one search'],
        ['rewording is a new hypothesis, not a re-roll', 'reword freely, but make it a real alternative'],
        ['the model brings its own world knowledge', 'your own knowledge of the world'],
        ['intermediate probes are free', 'intermediate probes cost them nothing'],
        ['a thin result proves nothing', 'an empty result tells you NOTHING'],
        ['a thin result is not a reason to ask either', 'never stop to ask'],
        ['a disconfirming read is a lead, not a dead end', 'IS your next hypothesis'],
        ['the sender belongs in from, not in keyword', 'is `from: "Sam"` with `begin`/`end` set and `keyword: null`'],
    ])('pins %s in both variants', (_case, claim) => {
        expect(buildMailSearchGuide(indexedESStatus())).toContain(claim);
        expect(buildMailSearchGuide(indexedESStatus({ esEnabled: false }))).toContain(claim);
    });

    it('frames both engines as casting the widest net they allow', () => {
        expect(buildMailSearchGuide(indexedESStatus())).toContain(
            'the widest net this engine gives you is a SINGLE short stem'
        );
        expect(buildMailSearchGuide(indexedESStatus({ esEnabled: false }))).toContain(
            'the widest net this engine gives you is an OR'
        );
    });

    it.each([['One good search'], ['Do NOT run another search'], ['ONE different term'], ['change AXIS, not wording']])(
        'does not reimpose a search quota (%s)',
        (banned) => {
            expect(buildMailSearchGuide(indexedESStatus())).not.toContain(banned);
            expect(buildMailSearchGuide(indexedESStatus({ esEnabled: false }))).not.toContain(banned);
        }
    );

    it.each([
        ['the framing head', 'The search tool LOCATES emails.'],
        ['the params list', "Params (set null what you don't need):"],
        ['the coverage block', 'Body-content search:'],
    ])('shares %s across both variants', (_case, section) => {
        expect(buildMailSearchGuide(indexedESStatus())).toContain(section);
        expect(buildMailSearchGuide(indexedESStatus({ esEnabled: false }))).toContain(section);
    });
});
