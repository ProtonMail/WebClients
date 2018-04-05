const I18N = {
    de_DE:
        'Holen Sie sich Ihre Privatsphäre zurück! Die Einrichtung Ihres sicheren E-Mail-Kontos dauert weniger als 2 Minuten.',
    en_US: 'Take back your privacy! Creating your secure email account takes less than 2 minutes.',
    es_ES: '¡Recupere su privacidad! Crear su cuenta de correo electrónico seguro toma menos de 2 minutos.',
    fr_FR: 'Reprenez votre vie privée en main ! Créer un compte de messagerie sécurisée prend moins de 2 minutes.',
    it_IT:
        'Riprenditi la tua privacy! La creazione del tuo account di posta elettronica sicura richiede meno di 2 minuti.',
    nl_NL: 'Krijg uw privacy terug! Uw beveiligde e-mailaccount aanmaken kost enkele minuten.',
    pl_PL: 'Odzyskaj swoją prywatność! Tworzenie bezpiecznego konta e-mail zajmuje mniej niż 2 minuty.',
    pt_BR: 'Take back your privacy! Creating your secure email account takes less than 2 minutes.',
    ru_RU:
        'Верните себе тайну переписки! Создание учётной записи для защищённой электронной почты займёт меньше 2 минут.',
    tr_TR: 'Mahremiyetinizi geri alın! Güvenli e-posta hesabınızı 2 dakikadan daha az bir sürede oluşturun.',
    uk_UA: 'Take back your privacy! Creating your secure email account takes less than 2 minutes.'
};

describe('Test languages', () => {
    Object.keys(I18N)
        .filter((key) => !/^uk|pt_/.test(key)) // website is not able to send us valid format
        .forEach((lang) => {
            const URL = `/create/new?language=${lang.substr(0, 2)}`;
            it('should translate the page into ' + lang.substr(0, 2), () => {
                cy.visit(Cypress.env('server') + URL);
                cy.url().should('include', URL);
                cy.get('[name="accountForm"] > .wrapper > .alert-info:first-of-type').contains(I18N[lang]);
            });
        });
});
