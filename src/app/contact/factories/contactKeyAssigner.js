import _ from 'lodash';
import vCard from 'vcf';

/* @ngInject */
function contactKeyAssigner(pmcw, contactKey) {
    const GROUP_PROPS = ['x-pm-mimetype', 'x-pm-encrypt', 'x-pm-sign', 'x-pm-scheme', 'x-pm-tls'];

    const normalize = (email) =>
        email
            .toLowerCase()
            .replace(/\+[^@]*@/, '')
            .replace(/[._-](?=[^@]*@)/g, '');

    const getKeyInfo = _.flowRight(
        pmcw.keyInfo,
        pmcw.binaryStringToArray,
        pmcw.decode_base64
    );

    const getEmailsByGroup = (data) => {
        const prop = data.get('email') || [];
        const propList = Array.isArray(prop) ? prop : [prop];

        return _.reduce(propList, (map, property) => _.extend(map, { [property.getGroup()]: property }), {});
    };

    const reassignProcess = (emailGroups, propList) =>
        Promise.all(
            _.map(propList, async (property) => {
                const value = await contactKey.getBase64Value(property);
                const dataValue = `data:application/pgp-keys;base64,${value}`;

                if (value === false) {
                    return [];
                }

                if (_.has(emailGroups, property.getGroup())) {
                    return [property];
                }

                // No group or group doesn't exist
                const info = await getKeyInfo(value);
                const userIds = info.userIds.map((userid) => /<([^>]*)>/.exec(userid)[1]);

                const matchingGroups = _.keys(emailGroups).filter((group) => {
                    const propEmail = normalize(emailGroups[group].valueOf());
                    return _.some(userIds, (userid) => normalize(userid) === propEmail);
                });

                // no match: just add them for every email.
                const keyGroups = matchingGroups.length ? matchingGroups : _.keys(emailGroups);
                return keyGroups.map((group) => new vCard.Property('key', dataValue, { group }));
            })
        );

    const filterGroupKeys = (emailGroups, data) =>
        GROUP_PROPS.forEach((key) => {
            const prop = data.get(key) || [];
            const propList = Array.isArray(prop) ? prop : [prop];
            const groupSeen = {};

            const newPropList = propList
                .filter((prop) => {
                    const group = prop.getGroup();
                    if (_.has(groupSeen, group)) {
                        return false;
                    }

                    groupSeen[group] = true;
                    return _.has(emailGroups, prop.getGroup());
                })
                .filter(_.identity);

            // set the property list to the new property list
            data.remove(key);
            newPropList.forEach(data.addProperty);
        });

    const reassign = async (data) => {
        const prop = data.get('key') || [];
        const propList = Array.isArray(prop) ? prop : [prop];

        // check if assigned properly.
        if (_.every(propList, (prop) => prop.getGroup())) {
            return;
        }

        const emailGroups = getEmailsByGroup(data);

        const groupKeys = _.flatten(await reassignProcess(emailGroups, propList));

        filterGroupKeys(emailGroups, data);

        data.remove('key');

        groupKeys.forEach((key) => data.addProperty(key));
    };

    return { reassign };
}
export default contactKeyAssigner;
