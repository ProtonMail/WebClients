import ICAL from 'ical.js';

/**
 * TODO: Same as from proton-contacts
 * Parse contact properties to create a ICAL vcard component
 * @param {Array} contact properties
 * @returns {ICAL.Component} vcard
 */
export const toICAL = (properties = []) => {
    const comp = new ICAL.Component('vcard');
    if (!properties.some(({ field }) => field === 'version')) {
        const versionProperty = new ICAL.Property('version');
        versionProperty.setValue('4.0');
        comp.addProperty(versionProperty);
    }
    return properties.reduce((component, { field, type, value, group }) => {
        const fieldWithGroup = [group, field].filter(Boolean).join('.');
        const property = new ICAL.Property(fieldWithGroup);
        property.setValue(value);
        type && property.setParameter('type', type);
        component.addProperty(property);
        return component;
    }, comp);
};

/**
 * ICAL library can crash if the value saved in the vCard is improperly formatted
 * If it crash we get the raw value from jCal key
 * @param {ICAL.Property} property
 * @returns {Array<String>}
 */
const getRawValues = (property) => {
    try {
        return property.getValues();
    } catch (error) {
        const [, , , value = ''] = property.jCal || [];
        return [value];
    }
};

export const getValue = (property) => {
    const [value] = getRawValues(property).map((val) => {
        // adr
        if (Array.isArray(val)) {
            return val;
        }

        if (typeof val === 'string') {
            return val;
        }

        // date
        return val.toString();
    });

    return value;
};

/**
 * Parse vCard String and return contact properties model as an Array
 * @param {String} vcard to parse
 * @returns {Array} calendar properties ordered
 */
export const fromICAL = (vcard = '') => {
    const comp = new ICAL.Component(ICAL.parse(vcard));
    const vevent = comp.getFirstSubcomponent('vevent');
    const properties = vevent.getAllProperties();

    return properties
        .reduce((acc, property) => {
            const type = property.getParameter('type');
            const prefValue = property.getParameter('pref');
            const pref = typeof prefValue === 'string' ? +prefValue : 1;
            const splitted = property.name.split('.');
            const field = splitted[1] ? splitted[1] : splitted[0];

            // Ignore invalid field
            if (!field) {
                return acc;
            }

            const group = splitted[1] ? splitted[0] : undefined;
            const prop = { pref, field, group, type, value: getValue(property) };

            acc.push(prop);

            return acc;
        }, [])
        .sort((firstEl, secondEl) => {
            // WARNING `sort` is mutating the new array returned by reduce
            return firstEl.pref <= secondEl.pref;
        });
};
