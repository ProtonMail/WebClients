/** Given a raw public suffix list .dat content, strips out comments
 * and empty lines and only retain the private domains */
export const extractPrivateDomains = (publicSuffixList: string): string[] =>
    publicSuffixList.split('\n').filter((line) => line.length > 0 && !line.startsWith('//'));
