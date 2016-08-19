angular.module('proton.message')
.factory('transformPrefix', ($state, authentication, CONSTANTS) => {
    const REGEXP_IS_BREAK = new RegExp('(svg|src=(?!"blob:|"cid:|"data:)|background=|poster=)', 'g');
    const REGEXP_IS_FIX = new RegExp('(proton-url|proton-src|proton-svg|proton-background|proton-poster)', 'g');
    const url = new RegExp(/url\(/ig);
    const replace = (regex, html) => html.replace(regex, (match) => 'proton-' + match);

    return (html, message) => {
        const user = authentication.user || {ShowImages:0};
        const showImages = message.showImages || user.ShowImages || (CONSTANTS.WHITELIST.indexOf(message.Sender.Address) !== -1 && !message.IsEncrypted) || $state.is('printer');

        if (html.innerHTML.search(REGEXP_IS_BREAK) !== -1 || html.innerHTML.search(REGEXP_IS_FIX) !== -1) {
            if (showImages) {
                html.innerHTML = html.innerHTML.replace(REGEXP_IS_FIX, (match, $1) => $1.substring(7));
            } else {
                html.innerHTML = replace(url, replace(REGEXP_IS_BREAK, html.innerHTML));
            }

            message.showImages = showImages;
        }

        return html;
    };
});
