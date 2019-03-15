/* @ngInject */
function contactTransformLabel(gettextCatalog, translator) {
    const I18N = translator(() => ({
        adr: gettextCatalog.getString('Address', null, 'VCard key name'),
        anniversary: gettextCatalog.getString('Anniversary', null, 'VCard key name'),
        caladruri: gettextCatalog.getString('Calendar user address', null, 'VCard key name'),
        caluri: gettextCatalog.getString('URI for a calendar', null, 'VCard key name'),
        bday: gettextCatalog.getString('Birthday', null, 'VCard key name'),
        categories: gettextCatalog.getString('Categories', null, 'VCard key name'),
        cell: gettextCatalog.getString('Cell', null, 'VCard key name'),
        custom: gettextCatalog.getString('Custom', null, 'VCard key name'), // It's not a valid key
        other: gettextCatalog.getString('Other', null, 'VCard key name'), // It's not a valid key
        email: gettextCatalog.getString('Email', null, 'VCard key name'),
        fax: gettextCatalog.getString('Fax', null, 'VCard key name'),
        fburl: gettextCatalog.getString('Free or busy URL', null, 'VCard key name'),
        fn: gettextCatalog.getString('Name', null, 'VCard key name'),
        gender: gettextCatalog.getString('Gender', null, 'VCard key name'),
        geo: gettextCatalog.getString('Geolocation', null, 'VCard key name'),
        home: gettextCatalog.getString('Personal', null, 'VCard key name'),
        impp: gettextCatalog.getString('Impp', null, 'VCard key name'),
        key: gettextCatalog.getString('Public Key', null, 'VCard key name'),
        lang: gettextCatalog.getString('Language', null, 'VCard key name'),
        logo: gettextCatalog.getString('Logo', null, 'VCard key name'),
        member: gettextCatalog.getString('Member', null, 'VCard key name'),
        nickname: gettextCatalog.getString('Nickname', null, 'VCard key name'),
        note: gettextCatalog.getString('Note', null, 'VCard key name'),
        office: gettextCatalog.getString('Office', null, 'VCard key name'),
        org: gettextCatalog.getString('Organization', null, 'VCard key name'),
        photo: gettextCatalog.getString('Photo', null, 'VCard key name'),
        private: gettextCatalog.getString('Private', null, 'VCard key name'),
        prodid: gettextCatalog.getString('Software', null, 'VCard key name'),
        related: gettextCatalog.getString('Related', null, 'VCard key name'),
        rev: gettextCatalog.getString('Revision', null, 'VCard key name'),
        role: gettextCatalog.getString('Role', null, 'VCard key name'),
        sound: gettextCatalog.getString('Sound', null, 'VCard key name'),
        voice: gettextCatalog.getString('Phone', null, 'VCard key name'),
        tel: gettextCatalog.getString('Phone', null, 'VCard key name'),
        title: gettextCatalog.getString('Title', null, 'VCard key name'),
        tz: gettextCatalog.getString('Timezone', null, 'VCard key name'),
        mobile: gettextCatalog.getString('Mobile', null, 'VCard key name'),
        personal: gettextCatalog.getString('Personal', null, 'VCard key name'),
        uid: 'UID',
        url: 'URL',
        work: gettextCatalog.getString('Work', null, 'VCard key name'),
        'pm-scheme': gettextCatalog.getString('Cryptographic scheme', null, 'VCard key name'),
        'pm-mimetype': gettextCatalog.getString('Format', null, 'VCard key name'),
        'pm-sign': gettextCatalog.getString('Sign', null, 'VCard key name'),
        'pm-encrypt': gettextCatalog.getString('Encrypt', null, 'VCard key name'),
        'pm-tls': gettextCatalog.getString('TLS', null, 'VCard key name')
    }));

    const MAP_KEYS = Object.keys(I18N);

    /**
     * Transform vCard label to language if a reference is found, or undefined
     * @param  {String} label
     * @return {String}
     */
    const toLangExplicit = (label = '') => I18N[label.toLowerCase()];

    /**
     * Transform vCard label to language if a reference is found
     * or Uppercase the first letter
     * @param  {String} input
     * @return {String}
     */
    const toLang = (input = '') => {
        const label = input.toLowerCase();
        const value = label.startsWith('x-') ? label.slice(2) : label;
        return I18N[value] || `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
    };

    /**
     * Transform displayed label to key
     * @param  {String} label
     * @return {Boolean / String}
     */
    const toVCard = (label = '') => {
        const key = MAP_KEYS.find((key) => label === I18N[key]);

        // Default value https://tools.ietf.org/html/rfc6350#section-6.4.1
        if (key === 'tel') {
            return 'voice';
        }

        return key || label;
    };

    return { toLang, toLangExplicit, toVCard };
}
export default contactTransformLabel;
