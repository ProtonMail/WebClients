angular.module('proton.ui')
    .directive('appVersion', (CONFIG) => {

        const URL = 'https://protonmail.com/blog/protonmail-v3-11-release-notes/';

        return {
            replace: true,
            template: `<a data-prefix="v" href="${URL}" title="${CONFIG.date_version}" target="_blank" class="appVersion-container">${CONFIG.app_version}</a>`
        };
    });
