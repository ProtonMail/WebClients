// eslint-disable-next-line no-useless-escape
const URL_REGEX = /(\b(?:https|ftps|file|mailto|tel|sms):(?:(?!["<>\^`{|}])\S)+)/gi;
const A_TAG_REGEX = /(<a[^>]+>.+?<\/a>)/gi;

export interface UrlifyOptions {
    target?: '_blank' | '_self' | '_parent' | '_top';
}

const urlify = (string: string, options: UrlifyOptions = {}): string => {
    const { target } = options;

    return string
        .split(A_TAG_REGEX)
        .map((piece) => {
            if (piece.match(A_TAG_REGEX)) {
                return piece;
            }

            return piece.replace(URL_REGEX, (match) => {
                let targetAttribute = '';
                let relAttribute = '';

                if (target) {
                    targetAttribute = ` target="${target}"`;
                    if (target === '_blank') {
                        relAttribute = ' rel="noopener noreferrer"';
                    }
                }

                return `<a href="${match}"${targetAttribute}${relAttribute}>${match}</a>`;
            });
        })
        .join('');
};

export default urlify;
