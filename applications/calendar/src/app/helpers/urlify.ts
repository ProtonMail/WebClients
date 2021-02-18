// eslint-disable-next-line no-useless-escape
const URL_REGEX = /(\b(?:https|ftps|file|mailto|tel|sms):(?:(?!["<>\^`{|}])\S)+)/gi;
const A_TAG_REGEX = /(<a[^>]+>.+?<\/a>)/gi;

const urlify = (string: string) =>
    string
        .split(A_TAG_REGEX)
        .map((piece) => {
            if (piece.match(A_TAG_REGEX)) {
                return piece;
            }

            return piece.replace(URL_REGEX, '<a href="$1">$1</a>');
        })
        .join('');

export default urlify;
