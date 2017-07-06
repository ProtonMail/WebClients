angular.module('proton.utils')
    .factory('parseUrl', () => {
        return (url) => {
            const parser = document.createElement('a');
            const searchObject = {};
            let split;
            // Let the browser do the work
            parser.href = url;
            // Convert query string to object
            const queries = parser.search.replace(/^\?/, '').split('&');

            for (let i = 0; i < queries.length; i++) {
                split = queries[i].split('=');
                searchObject[split[0]] = split[1];
            }

            return {
                protocol: parser.protocol,
                host: parser.host,
                hostname: parser.hostname,
                port: parser.port,
                pathname: parser.pathname,
                search: parser.search,
                searchObject,
                hash: parser.hash
            };
        };
    });
