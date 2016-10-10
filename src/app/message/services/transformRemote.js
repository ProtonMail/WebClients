angular.module('proton.message')
.factory('transformRemote', ($state, authentication, CONSTANTS) => {

    const REGEXP_IS_BREAK = new RegExp('(svg|xlink:href|srcset|src=(?!"blob:|"cid:|"data:)|background=|poster=)', 'g');
    const REGEXP_IS_FIX = new RegExp('(proton-url|proton-xlink:href|proton-srcset|proton-src|proton-svg|proton-background|proton-poster)', 'g');
    const REGEXP_IS_URL = new RegExp(/url\(/ig);

    const replace = (regex, content) => content.replace(regex, (match) => 'proton-' + match);

    return (content, message) => {
        const user = authentication.user || { ShowImages: 0 };
        const showImages = message.showImages || user.ShowImages || (CONSTANTS.WHITELIST.indexOf(message.Sender.Address) !== -1 && !message.IsEncrypted) || $state.is('printer');

        if (content.search(REGEXP_IS_BREAK) !== -1 || content.search(REGEXP_IS_FIX) !== -1) {
            message.showImages = showImages;
            if (showImages) {
                return content.replace(REGEXP_IS_FIX, (match, $1) => $1.substring(7));
            }

            return replace(REGEXP_IS_URL, replace(REGEXP_IS_BREAK, content));
        }

        return content;
    };
});
