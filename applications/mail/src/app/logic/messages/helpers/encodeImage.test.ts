import encodeImageUri from './encodeImageUri';

const domain = 'https://test.com';

describe('encode image url', () => {
    it.each`
        url                          | expectedUrl
        ${domain + '/a space.png'}   | ${domain + '/a%20space.png'}
        ${domain + '/a%20space.png'} | ${domain + '/a%20space.png'}
        ${domain + '/logo.png"'}     | ${domain + '/logo.png%22'}
        ${domain + '/logo.png%22'}   | ${domain + '/logo.png%22'}
        ${domain + '/logo.png&quot'} | ${domain + '/logo.png&quot'}
    `('Encoding $url should return $expectedUrl', ({ url, expectedUrl }) => {
        expect(encodeImageUri(url)).toBe(expectedUrl);
    });
});
