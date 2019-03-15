/* @ngInject */
function autoresponderLanguage(gettextCatalog, translator) {
    // Not translated: it's not editable, foreign people doing international business wouldn't want it to be translated
    // if we make it editable we can translate it again.
    const DEFAULT_SUBJECT_PREFIX = 'Auto';

    const I18N = translator(() => ({
        AUTORESPONDER_UPDATED_MESSAGE: gettextCatalog.getString('Autoresponder updated', null, 'Success'),
        AUTORESPONDER_INSTALLED_MESSAGE: gettextCatalog.getString('Autoresponder installed', null, 'Success'),
        AUTORESPONDER_REMOVED_MESSAGE: gettextCatalog.getString('Autoresponder removed', null, 'Success'),
        DEFAULT_BODY: gettextCatalog.getString(
            "<div>I'm out of the office with limited access to my email.</div>",
            null,
            'Default autoresponder message without signature (no regards, etcetera)'
        ),
        DURATION_FOREVER: gettextCatalog.getString('Permanent', null, 'Duration/repetition of autoresponder'),
        DURATION_FIXED: gettextCatalog.getString('Fixed duration', null, 'Duration/repetition of autoresponder'),
        DURATION_DAILY: gettextCatalog.getString('Repeat daily', null, 'Duration/repetition of autoresponder'),
        DURATION_WEEKLY: gettextCatalog.getString('Repeat weekly', null, 'Duration/repetition of autoresponder'),
        DURATION_MONTHLY: gettextCatalog.getString('Repeat monthly', null, 'Duration/repetition of autoresponder')
    }));
    I18N.DEFAULT_SUBJECT_PREFIX = DEFAULT_SUBJECT_PREFIX;

    return I18N;
}
export default autoresponderLanguage;
