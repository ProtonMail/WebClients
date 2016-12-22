angular.module('proton.ui')
.directive('noResults', (tools, gettextCatalog) => ({
    restrict: 'E',
    replace: true,
    templateUrl: 'templates/directives/ui/noResults.tpl.html',
    link(scope, element) {
        const $icon = element[0].querySelector('i');
        const $span = element[0].querySelector('span');
        const $h3 = element[0].querySelector('h3');
        const box = tools.currentMailbox();
        const type = tools.typeList();
        const variables = {
            inbox: { icon: 'fa-inbox', text: gettextCatalog.getString('Inbox', null, 'No results heading') },
            drafts: { icon: 'fa-file-text-o', text: gettextCatalog.getString('Drafts', null, 'No results heading') },
            sent: { icon: 'fa-sign-out', text: gettextCatalog.getString('Sent', null, 'No results heading') },
            trash: { icon: 'fa-trash-o', text: gettextCatalog.getString('Trash', null, 'No results heading') },
            spam: { icon: 'fa-ban', text: gettextCatalog.getString('Spam', null, 'No results heading') },
            starred: { icon: 'fa-star-o', text: gettextCatalog.getString('Starred', null, 'No results heading') },
            archive: { icon: 'fa-archive', text: gettextCatalog.getString('Archive', null, 'No results heading') },
            search: { icon: 'fa-search', text: gettextCatalog.getString('Search', null, 'No results heading') },
            label: { icon: 'fa-tag', text: gettextCatalog.getString('Label', null, 'No results heading') }
        };
        $icon.classList.add(variables[box].icon);
        $span.textContent = variables[box].text;
        $h3.textContent = (type === 'conversation') ? gettextCatalog.getString('No conversations', null, 'Title') : gettextCatalog.getString('No messages', null, 'Title');
    }
}));
