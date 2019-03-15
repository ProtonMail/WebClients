import { SPAM_SCORE } from '../../constants';

const { PHISHING, DMARC_FAILED, PM_SPOOFED } = SPAM_SCORE;

/* @ngInject */
function messageSpamScore(gettextCatalog, translator) {
    const I18N = translator(() => ({
        [PM_SPOOFED]: gettextCatalog.getString(
            'This email seems to be from a ProtonMail address but came from outside our system and failed our authentication requirements. It may be spoofed or improperly forwarded!',
            null,
            'Info'
        ),
        [DMARC_FAILED]: gettextCatalog.getString(
            "This email has failed its domain's authentication requirements. It may be spoofed or improperly forwarded! {{startLink}}Learn more{{endLink}}.",
            {
                startLink:
                    '<a href="https://protonmail.com/support/knowledge-base/email-has-failed-its-domains-authentication-requirements-warning/" target="_blank">',
                endLink: '</a>'
            },
            'Info'
        ),
        [PHISHING]: gettextCatalog.getString(
            'This message may be a phishing attempt. Please check the sender and contents to make sure they are legitimate. {{startLink}}Learn more{{endLink}}.',
            {
                startLink: '<a href="https://protonmail.com/blog/prevent-phishing-attacks/" target="_blank">',
                endLink: '</a>'
            },
            'Info'
        )
    }));

    return {
        replace: true,
        template: `
            <div class="messageSpamScore-container">
                <span class="messageSpamScore-notice"></span>
            </div>
        `,
        link(scope, el, { score }) {
            const $notice = el[0].querySelector('.messageSpamScore-notice');
            $notice.innerHTML = I18N[score];
        }
    };
}
export default messageSpamScore;
