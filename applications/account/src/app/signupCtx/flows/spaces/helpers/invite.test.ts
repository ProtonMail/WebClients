import { getSpacesInviteFromSearchParams, getSpacesSignInUrl } from './invite';

const emailLink = new URL(
    'https://account.proton.me/spaces/signup?invitee=user%40example.com&preVerifiedAddressToken=token#orgJoinLink=https%3A%2F%2Fspaces.proton.me%2Fj%2Fabc%23def'
);

const getParams = () => ({
    searchParams: new URLSearchParams(emailLink.search),
    hashParams: new URLSearchParams(emailLink.hash.replace(/^#/, '')),
});

describe('getSpacesInviteFromSearchParams', () => {
    it('returns the spaces invite from the email link', () => {
        const { searchParams, hashParams } = getParams();

        expect(getSpacesInviteFromSearchParams(searchParams, hashParams)).toEqual({
            type: 'spaces',
            data: {
                invitee: 'user@example.com',
                orgJoinLink: 'https://spaces.proton.me/j/abc#def',
                preVerifiedAddressToken: 'token',
            },
        });
    });

    it.each(['invitee', 'preVerifiedAddressToken'])('returns undefined when %s is missing', (missingParam) => {
        const { searchParams, hashParams } = getParams();
        searchParams.delete(missingParam);

        expect(getSpacesInviteFromSearchParams(searchParams, hashParams)).toBeUndefined();
    });

    it('returns undefined when orgJoinLink is missing', () => {
        const { searchParams } = getParams();

        expect(getSpacesInviteFromSearchParams(searchParams, new URLSearchParams())).toBeUndefined();
    });
});

describe('getSpacesSignInUrl', () => {
    it('keeps the token in the query and the join link in the hash, like the email link', () => {
        expect(
            getSpacesSignInUrl({
                loginUrl: '/spaces',
                invitee: 'user@example.com',
                preVerifiedAddressToken: 'token',
                orgJoinLink: 'https://spaces.proton.me/j/abc#def',
            })
        ).toBe(
            '/spaces?prompt=login&username=user%40example.com&preVerifiedAddressToken=token#orgJoinLink=https%3A%2F%2Fspaces.proton.me%2Fj%2Fabc%23def'
        );
    });

    it('leaves out the hash and the missing params', () => {
        expect(getSpacesSignInUrl({ loginUrl: '/spaces' })).toBe('/spaces?prompt=login');
    });
});
