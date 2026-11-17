import { indexedESStatus } from '../helpers/navigation.test.helpers';
import { buildMailSearchGuide, buildStandaloneMailSearchGuide } from './searchGuide';

const SUBSTRING_CLAIM = 'There is no OR, and no operators of any kind.';
const OPERATOR_CLAIM = 'Casting a wide net here: several plain searches, one short word each.';

describe('buildMailSearchGuide', () => {
    it('teaches substring matching when Encrypted Search will run the query', () => {
        const guide = buildMailSearchGuide(indexedESStatus());

        expect(guide).toContain(SUBSTRING_CLAIM);
        expect(guide).not.toContain(OPERATOR_CLAIM);
    });

    it.each([
        ['no index on this device', { dbExists: false }],
        ['the user switched it off', { esEnabled: false }],
    ])('teaches several plain searches when %s', (_case, esStatus) => {
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

    // On the server a plain word matches inside longer words and any operator turns that off, so
    // `receipt`, `order` and `ticket` as three searches find mail one OR of them misses.
    it('widens with several plain searches instead of an OR', () => {
        const guide = buildMailSearchGuide(indexedESStatus({ esEnabled: false }));

        expect(guide).toContain('not one combined query');
        expect(guide).not.toContain('`invoice | receipt | payment | statement`');
    });

    it('drops the operators that were never checked against the server', () => {
        const guide = buildMailSearchGuide(indexedESStatus({ esEnabled: false }));

        expect(guide).not.toContain('brackets group');
        expect(guide).not.toContain('anchors');
        expect(guide).not.toContain('proximity');
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
            'the widest net is SEVERAL searches'
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

const STANDALONE_SUBSTRING_VARIANT = 'Matching on this device: one short stem.';
const STANDALONE_OPERATOR_VARIANT = 'Matching on this device: several plain searches.';

describe('buildStandaloneMailSearchGuide', () => {
    it('teaches substring matching when Encrypted Search will run the query', () => {
        const guide = buildStandaloneMailSearchGuide(indexedESStatus());

        expect(guide).toContain(STANDALONE_SUBSTRING_VARIANT);
        expect(guide).not.toContain(STANDALONE_OPERATOR_VARIANT);
    });

    it.each([
        ['no index on this device', { dbExists: false }],
        ['the user switched it off', { esEnabled: false }],
    ])('teaches several plain searches when %s', (_case, esStatus) => {
        const guide = buildStandaloneMailSearchGuide(indexedESStatus(esStatus));

        expect(guide).toContain(STANDALONE_OPERATOR_VARIANT);
        expect(guide).not.toContain(STANDALONE_SUBSTRING_VARIANT);
    });

    // The syntax regime turns only on who parses the keyword: a metadata-only index still normalises it.
    it('keeps substring rules while content indexing is unfinished, since ES still parses the keyword', () => {
        expect(
            buildStandaloneMailSearchGuide(indexedESStatus({ contentIndexingDone: false, isDBLimited: true }))
        ).toContain(STANDALONE_SUBSTRING_VARIANT);
    });

    it('widens with several plain searches and drops the unchecked operators', () => {
        const guide = buildStandaloneMailSearchGuide(indexedESStatus({ esEnabled: false }));

        expect(guide).toContain('not one combined query');
        expect(guide).not.toContain('brackets group');
        expect(guide).not.toContain('anchors');
    });
});
