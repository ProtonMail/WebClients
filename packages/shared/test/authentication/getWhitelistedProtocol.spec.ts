import { getWhitelistedProtocol } from '../../lib/authentication/fork';
import { APPS, type APP_NAMES } from '../../lib/constants';

describe('getWhitelistedProtocol', () => {
    [
        {
            name: 'should return undefined for invalid protocol',
            input: { app: APPS.PROTONMAIL, protocol: '/\\\\foo.bar://' },
            output: undefined,
        },
        {
            name: 'should return undefined non-proton protocol',
            input: { app: APPS.PROTONMAIL, protocol: 'foo.bar://' },
            output: undefined,
        },
        {
            name: 'should return undefined for invalid non-proton protocol',
            input: { app: APPS.PROTONMAIL, protocol: '/\\\\proton-mail://' },
            output: undefined,
        },
        {
            name: 'should return undefined for mismatching app',
            input: { app: 'proton-foo' as unknown as APP_NAMES, protocol: 'proton-bar://' },
            output: undefined,
        },
        {
            name: 'should return proton-mail for proton-mail protocol',
            input: { app: APPS.PROTONMAIL, protocol: 'proton-mail://' },
            output: 'proton-mail:',
        },
        {
            name: 'should return proton for proton protocol',
            input: { app: APPS.PROTONMAIL, protocol: 'proton://' },
            output: 'proton:',
        },
        {
            name: 'should return protonmail for protonmail protocol',
            input: { app: APPS.PROTONMAIL, protocol: 'protonmail://' },
            output: 'protonmail:',
        },
        {
            name: 'should return proton-foo for proton-foo',
            input: { app: 'proton-foo' as unknown as APP_NAMES, protocol: 'proton-foo://' },
            output: 'proton-foo:',
        },
    ].forEach(({ name, input, output }) => {
        it(name, () => {
            expect(getWhitelistedProtocol(input.app, input.protocol)).toBe(output);
        });
    });
});
