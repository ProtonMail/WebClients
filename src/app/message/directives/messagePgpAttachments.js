angular.module('proton.message')
    .directive('messagePgpAttachments', (gettextCatalog) => {
        const title = gettextCatalog.getString('PGP/MIME Attachments Not Supported', null);
        const message = gettextCatalog.getString('This PGP/MIME message contains attachments which currently are not supported by ProtonMail.', null);
        return {
            replace: true,
            restrict: 'E',
            template: `
                <div class="messagePgpAttachments-container">
                    <i class="messageSpamScore-icon fa fa-paperclip"></i>
                    <div class="messagePgpAttachments-content">
                        <strong>${title}</strong> ${message}
                    </div>
                </div>
            `
        };
    });
