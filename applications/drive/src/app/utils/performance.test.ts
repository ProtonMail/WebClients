import { getCurrentPageType } from './performance';

describe('getCurrentPageType', () => {
    test('should return correct pageType', () => {
        expect(
            getCurrentPageType(
                '/u/14/93b6QQHBOW5gLNeIv8alVi7vVG5131MJdEDvHFkp6tqaxmeKxKIXBupvOI3r3Qk5tBFzImcWIHq3--uPphicyg==/file/7fd9vEITnQ49gWQ0n1yIcGimsfgZMsQBVaVfkCT4kB70hbDvOiedpUZNjINctPkdP9jjublTMKdQQO7E1je92A=='
            )
        ).toEqual('filebrowser');
        expect(
            getCurrentPageType(
                '/u/14/93b6QQHBOW5gLNeIv8alVi7vVG5131MJdEDvHFkp6tqaxmeKxKIXBupvOI3r3Qk5tBFzImcWIHq3--uPphicyg==/folder/7PSPIhQBTPHmNWl21o1EYtOiBiBE_r10buNFU4t6dDfSqmjm07AJXCHsiCGJos2BAz56PJdZ1P-Jeq9sxmGKGQ=='
            )
        ).toEqual('filebrowser');
        expect(getCurrentPageType('/u/14')).toEqual('filebrowser');
        expect(getCurrentPageType('/')).toEqual('filebrowser');
        expect(getCurrentPageType('///')).toEqual('filebrowser');

        expect(getCurrentPageType('/u/0/devices')).toEqual('computers');
        expect(getCurrentPageType('/devices')).toEqual('computers');
        expect(getCurrentPageType('//devices')).toEqual('computers');

        expect(getCurrentPageType('/u/1/shared-urls')).toEqual('shared_by_me');
        expect(getCurrentPageType('/shared-urls')).toEqual('shared_by_me');
        expect(getCurrentPageType('///shared-urls')).toEqual('shared_by_me');

        expect(getCurrentPageType('/u/0/shared-with-me')).toEqual('shared_with_me');
        expect(getCurrentPageType('/shared-with-me')).toEqual('shared_with_me');
        expect(getCurrentPageType('//shared-with-me')).toEqual('shared_with_me');

        expect(getCurrentPageType('/u/0/trash')).toEqual('trash');
        expect(getCurrentPageType('/trash')).toEqual('trash');
        expect(getCurrentPageType('//trash')).toEqual('trash');

        expect(getCurrentPageType('/u/0/photos')).toEqual('photos');
        expect(getCurrentPageType('/photos')).toEqual('photos');
        expect(getCurrentPageType('//photos')).toEqual('photos');

        expect(getCurrentPageType('/u/0/trash')).toEqual('trash');
        expect(getCurrentPageType('/trash')).toEqual('trash');
        expect(getCurrentPageType('//trash')).toEqual('trash');

        expect(getCurrentPageType('/urls/0VTVZ5ZPVR#3JQRGUK74GI5')).toEqual('public_page');
        expect(getCurrentPageType('/urls/0VTVZ5ZPVR')).toEqual('public_page');
        expect(getCurrentPageType('//urls/0VTVZ5ZPVR#3JQRGUK74GI5')).toEqual('public_page');

        expect(getCurrentPageType('/no-access')).toEqual(undefined);
        expect(getCurrentPageType('/u/0/no-access')).toEqual(undefined);
        expect(getCurrentPageType('/u/0///no-access')).toEqual(undefined);
    });
});
