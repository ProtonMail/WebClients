angular.module('proton.ui')
    .directive('appVersion', (CONFIG) => {
        const URL = 'https://protonmail.com/blog/protonmail-v3-9-release-notes/';

        return {
            replace: true,
            template: `<a data-prefix="v" href="${URL}" target="_blank" class="appVersion-container"></a>`,
            compile(el) {
                el[0].textContent = CONFIG.app_version;
                el[0].title = CONFIG.date_version;
            }
        };
    });
