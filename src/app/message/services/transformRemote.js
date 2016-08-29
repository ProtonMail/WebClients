angular.module('proton.message')
.factory('transformRemote', ($state, authentication, CONSTANTS, tools) => {
    const REGEXP_IS_BREAK = new RegExp('(svg|src=(?!"blob:|"cid:|"data:)|background=|poster=)', 'g');
    const REGEXP_IS_FIX = new RegExp('(proton-url|proton-src|proton-svg|proton-background|proton-poster)', 'g');
    const url = new RegExp(/url\(/ig);
    const replace = (regex, content) => content.replace(regex, (match) => 'proton-' + match);

    return (content, message) => {
        const user = authentication.user || {ShowImages:0};
        const showImages = message.showImages || user.ShowImages || (CONSTANTS.WHITELIST.indexOf(message.Sender.Address) !== -1 && !message.IsEncrypted) || $state.is('printer');

        if (content.search(REGEXP_IS_BREAK) !== -1 || content.search(REGEXP_IS_FIX) !== -1) {
            if (showImages) {
                content = content.replace(REGEXP_IS_FIX, (match, $1) => $1.substring(7));
            } else {
                content = replace(url, replace(REGEXP_IS_BREAK, content));
            }

            message.showImages = showImages;
        }

        return tools.fixRedirectExploits(content);
    };
});
