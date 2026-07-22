const {
    kebabToPascal,
    enumKeyFor,
    sanitizeDescription,
    descriptionFor,
    deprecationReasonFor,
    assertUniqueKeys,
    mergeReleaseCandidateFeatures,
    filterRemovedFeatures,
    compareKeys,
    render,
} = require('./lib');

describe('kebabToPascal', () => {
    it('converts kebab-case to PascalCase', () => {
        expect(kebabToPascal('max-vaults')).toBe('MaxVaults');
        expect(kebabToPascal('vpn')).toBe('Vpn');
        expect(kebabToPascal('activity-monitor-organization-settings')).toBe('ActivityMonitorOrganizationSettings');
    });

    it('does not split inside a kebab segment containing digits', () => {
        expect(kebabToPascal('max-b2bips')).toBe('MaxB2bips');
    });
});

describe('enumKeyFor', () => {
    it('returns the override when present', () => {
        expect(enumKeyFor('max-b2bips', { names: { 'max-b2bips': 'MaxB2bIps' } })).toBe('MaxB2bIps');
    });

    it('falls back to kebabToPascal when no override', () => {
        expect(enumKeyFor('max-vaults', {})).toBe('MaxVaults');
        expect(enumKeyFor('max-vaults', { names: {} })).toBe('MaxVaults');
    });
});

describe('sanitizeDescription', () => {
    it('collapses internal whitespace and trims', () => {
        expect(sanitizeDescription('  multiple   spaces  ')).toBe('multiple spaces');
    });

    it('collapses newlines so multi-line descriptions stay on one JSDoc line', () => {
        expect(sanitizeDescription('line one\nline two')).toBe('line one line two');
    });

    it('neutralizes */ so descriptions cannot terminate the JSDoc comment', () => {
        expect(sanitizeDescription('contains */ in middle')).toBe('contains * / in middle');
    });
});

describe('descriptionFor', () => {
    it('uses Chargebee description when no override', () => {
        expect(descriptionFor({ id: 'foo', description: 'orig' }, {})).toBe('orig');
    });

    it('uses the override when present, overriding Chargebee', () => {
        const overrides = { descriptions: { foo: 'overridden' } };
        expect(descriptionFor({ id: 'foo', description: 'orig' }, overrides)).toBe('overridden');
    });

    it('allows an empty-string override to blank out a Chargebee description', () => {
        const overrides = { descriptions: { foo: '' } };
        expect(descriptionFor({ id: 'foo', description: 'orig' }, overrides)).toBe('');
    });

    it('treats a missing Chargebee description as empty', () => {
        expect(descriptionFor({ id: 'foo' }, {})).toBe('');
    });

    it('applies sanitization to the final value', () => {
        expect(descriptionFor({ id: 'foo', description: 'a\n*/b' }, {})).toBe('a * /b');
    });
});

describe('assertUniqueKeys', () => {
    it('passes when all keys are unique', () => {
        expect(() => assertUniqueKeys([{ id: 'foo' }, { id: 'bar' }], {})).not.toThrow();
    });

    it('throws when two Chargebee IDs map to the same enum key', () => {
        const overrides = { names: { foo: 'Same', bar: 'Same' } };
        expect(() => assertUniqueKeys([{ id: 'foo' }, { id: 'bar' }], overrides)).toThrow(/collision/);
    });

    it('throws when the same Chargebee ID appears twice', () => {
        expect(() => assertUniqueKeys([{ id: 'a-b' }, { id: 'a-b' }], {})).toThrow(/collision/);
    });
});

describe('mergeReleaseCandidateFeatures', () => {
    it('adds release-candidate entries that are not in Chargebee yet', () => {
        const { features, supersededByChargebee } = mergeReleaseCandidateFeatures(
            [{ id: 'existing', description: 'x' }],
            {
                releaseCandidates: ['new-feature'],
            }
        );

        expect(features).toEqual([
            { id: 'existing', description: 'x' },
            { id: 'new-feature', description: '' },
        ]);
        expect(supersededByChargebee).toEqual([]);
    });

    it('drops release-candidate entries that Chargebee already returns and reports them', () => {
        const { features, supersededByChargebee } = mergeReleaseCandidateFeatures(
            [{ id: 'existing', description: 'x' }],
            {
                releaseCandidates: ['existing'],
            }
        );

        expect(features).toEqual([{ id: 'existing', description: 'x' }]);
        expect(supersededByChargebee).toEqual(['existing']);
    });

    it('treats a missing releaseCandidates key as no-op', () => {
        const chargebee = [{ id: 'a', description: '' }];
        const { features, supersededByChargebee } = mergeReleaseCandidateFeatures(chargebee, {});

        expect(features).toEqual(chargebee);
        expect(supersededByChargebee).toEqual([]);
    });

    it('lets release-candidate entries pick up name and description overrides via render', () => {
        const { features } = mergeReleaseCandidateFeatures([], {
            releaseCandidates: ['draft-feature'],
        });
        const output = render(features, {
            names: { 'draft-feature': 'DraftFeature' },
            descriptions: { 'draft-feature': 'Not in prod yet' },
        });

        expect(output).toContain("DraftFeature = 'draft-feature'");
        expect(output).toContain('/** Not in prod yet */');
    });
});

describe('deprecationReasonFor', () => {
    it('marks archived features as deprecated', () => {
        expect(deprecationReasonFor({ id: 'foo', status: 'archived' })).toBe(
            'Archived in Chargebee and scheduled for removal.'
        );
    });

    it('marks deleted features as deprecated', () => {
        expect(deprecationReasonFor({ id: 'foo', status: 'deleted' })).toBe(
            'Deleted in Chargebee and scheduled for removal.'
        );
    });

    it('returns no reason for active, draft, or status-less features', () => {
        expect(deprecationReasonFor({ id: 'foo', status: 'active' })).toBe('');
        expect(deprecationReasonFor({ id: 'foo', status: 'draft' })).toBe('');
        expect(deprecationReasonFor({ id: 'foo' })).toBe('');
    });
});

describe('filterRemovedFeatures', () => {
    it('drops features whose id is in the removed list', () => {
        const { features, removedStillActive } = filterRemovedFeatures(
            [
                { id: 'keep', status: 'active' },
                { id: 'gone', status: 'archived' },
            ],
            { removed: ['gone'] }
        );

        expect(features).toEqual([{ id: 'keep', status: 'active' }]);
        expect(removedStillActive).toEqual([]);
    });

    it('reports a removed id that is still active in Chargebee but still excludes it', () => {
        const { features, removedStillActive } = filterRemovedFeatures(
            [
                { id: 'keep', status: 'active' },
                { id: 'live', status: 'active' },
            ],
            { removed: ['live'] }
        );

        expect(features).toEqual([{ id: 'keep', status: 'active' }]);
        expect(removedStillActive).toEqual(['live']);
    });

    it('treats a missing removed key as no-op', () => {
        const chargebee = [{ id: 'a', status: 'active' }];
        const { features, removedStillActive } = filterRemovedFeatures(chargebee, {});

        expect(features).toEqual(chargebee);
        expect(removedStillActive).toEqual([]);
    });
});

describe('compareKeys', () => {
    it('returns -1, 0, 1 for less / equal / greater', () => {
        expect(compareKeys('a', 'b')).toBe(-1);
        expect(compareKeys('a', 'a')).toBe(0);
        expect(compareKeys('b', 'a')).toBe(1);
    });

    it('uses byte-wise ordering so uppercase sorts before lowercase deterministically', () => {
        expect(compareKeys('MaxVaultS', 'MaxVaults')).toBe(-1);
    });
});

describe('render', () => {
    it('emits the DO NOT EDIT banner and an enum sorted by key', () => {
        const features = [
            { id: 'bar', description: 'bar desc' },
            { id: 'foo', description: '' },
        ];
        const output = render(features, {});

        expect(output).toContain('AUTO-GENERATED FILE');
        expect(output).toContain("Bar = 'bar'");
        expect(output).toContain("Foo = 'foo'");
        expect(output.indexOf("Bar = 'bar'")).toBeLessThan(output.indexOf("Foo = 'foo'"));
    });

    it('emits JSDoc only for non-empty descriptions', () => {
        const features = [
            { id: 'with-desc', description: 'the description' },
            { id: 'no-desc', description: '' },
        ];
        const output = render(features, {});

        expect(output).toContain('/** the description */');
        expect(output).not.toMatch(/\/\*\* *\*\//);
    });

    it('applies name and description overrides together', () => {
        const features = [{ id: 'max-b2bips', description: 'orig' }];
        const overrides = {
            names: { 'max-b2bips': 'MaxB2bIps' },
            descriptions: { 'max-b2bips': 'Maximum B2B IPs' },
        };
        const output = render(features, overrides);

        expect(output).toContain("MaxB2bIps = 'max-b2bips'");
        expect(output).toContain('/** Maximum B2B IPs */');
    });

    it('propagates the collision check', () => {
        expect(() => render([{ id: 'a' }, { id: 'a' }], {})).toThrow(/collision/);
    });

    it('sanitizes descriptions that would otherwise break the JSDoc comment', () => {
        const features = [{ id: 'foo', description: 'malicious */ payload' }];
        const output = render(features, {});

        expect(output).toContain('/** malicious * / payload */');
    });

    it('emits a multi-line @deprecated block for archived features, keeping the description', () => {
        const features = [{ id: 'foo', description: 'the description', status: 'archived' }];
        const output = render(features, {});

        expect(output).toContain('     * the description');
        expect(output).toContain('     * @deprecated Archived in Chargebee and scheduled for removal.');
        expect(output).toContain("Foo = 'foo'");
    });

    it('emits @deprecated even when an archived feature has no description', () => {
        const features = [{ id: 'foo', description: '', status: 'deleted' }];
        const output = render(features, {});

        expect(output).toContain('     * @deprecated Deleted in Chargebee and scheduled for removal.');
        expect(output).not.toMatch(/^\s+\*\s*$/m);
    });

    it('keeps active features on a single-line JSDoc without a deprecation tag', () => {
        const features = [{ id: 'foo', description: 'the description', status: 'active' }];
        const output = render(features, {});

        expect(output).toContain('/** the description */');
        expect(output).not.toContain('@deprecated');
    });
});
