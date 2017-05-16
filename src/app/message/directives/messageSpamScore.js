angular.module('proton.message')
.directive('messageSpamScore', (gettextCatalog) => {

    const scoreNotice = {
        100: gettextCatalog.getString('This email seems to be from a ProtonMail address but came from outside our system and failed our authentication requirements. It may be spoofed or improperly forwarded!', null, 'Info'),
        101: gettextCatalog.getString("This email has failed its domain's authentication requirements. It may be spoofed or improperly forwarded!", null, 'Info')
    };

    return {
        replace: true,
        template: `<div class="messageSpamScore-container">
                        <i class="messageSpamScore-icon fa fa-ban"></i>
                        <span class="messageSpamScore-notice"></span>
                    </div>`,
        link(scope, el, { score }) {
            const $notice = el[0].querySelector('.messageSpamScore-notice');
            $notice.textContent = scoreNotice[score];
        }
    };
});
