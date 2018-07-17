/* @ngInject */
function messageSpamScore(gettextCatalog) {
    const scoreNotice = {
        100: gettextCatalog.getString(
            'This email seems to be from a ProtonMail address but came from outside our system and failed our authentication requirements. It may be spoofed or improperly forwarded!',
            null,
            'Info'
        ),
        101: gettextCatalog.getString(
            "This email has failed its domain's authentication requirements. It may be spoofed or improperly forwarded!",
            null,
            'Info'
        ),
        102: gettextCatalog.getString(
            'This message may be a phishing attempt. Please check the sender and contents to make sure they are legitimate. {{startLink}}Learn more{{endLink}}.',
            {
                startLink: '<a href="https://protonmail.com/blog/prevent-phishing-attacks/" target="_blank">',
                endLink: '</a>'
            },
            'Info'
        )
    };

    return {
        replace: true,
        template: `
            <div class="messageSpamScore-container">
                <span class="messageSpamScore-notice"></span>
                <phishing-btn class="-button pm_button"></phishing-btn>
            </div>
        `,
        link(scope, el, { score }) {
            const $notice = el[0].querySelector('.messageSpamScore-notice');
            $notice.innerHTML = scoreNotice[score];
        }
    };
}
export default messageSpamScore;
