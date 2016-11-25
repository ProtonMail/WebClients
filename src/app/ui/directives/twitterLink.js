angular.module('proton.ui')
    .directive('twitterLink', ($httpParamSerializer) => {
        return {
            restrict: 'A',
            link(scope, element, attributes) {
                // https://dev.twitter.com/web/tweet-button/web-intent
                const webIntentUrl = 'https://twitter.com/intent/tweet';
                const { text, url, hashtags, via, related, inReplyTo } = attributes;
                const parameters = $httpParamSerializer({ text, url, hashtags, via, related, inReplyTo });
                element[0].setAttribute('href', webIntentUrl + '?' + parameters);
            }
        };
    });
