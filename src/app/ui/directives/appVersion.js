angular.module('proton.ui')
    .directive('appVersion', (CONFIG) => {
        return {
            replace: true,
            template: `<a data-prefix="v" href="${CONFIG.articleLink}" title="${CONFIG.date_version}" target="_blank" class="appVersion-container">${CONFIG.app_version}</a>`
        };
    });
