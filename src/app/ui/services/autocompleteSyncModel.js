import _ from 'lodash';

/* @ngInject */
function autocompleteSyncModel(sendPreferences, CONSTANTS, autoPinPrimaryKeys, dispatchers) {
    const { dispatcher } = dispatchers(['autocompleteEmails']);

    const THROTTLING_DELAY = 1000;

    const addLoadingFlags = (emails) =>
        _.each(emails, (email) => {
            if (!_.has(email, 'loadCryptInfo')) {
                email.loadCryptInfo = true;
            }
        });

    const extendPGPFromOldData = (list, oldEmails) => {
        // create a map from address -> email object
        const oldEmailsMap = _.zipObject(_.map(oldEmails, 'Address'), oldEmails);
        return _.map(list, (email) => _.extend({}, oldEmailsMap[email.Address], email));
    };

    const extendPGP = (email, sendPref) => {
        email.encrypt = sendPref.encrypt;
        email.sign = sendPref.sign;
        email.isPgp = [CONSTANTS.SEND_TYPES.SEND_PGP_MIME, CONSTANTS.SEND_TYPES.SEND_PGP_INLINE].includes(sendPref.scheme);
        email.isPgpMime = sendPref.scheme === CONSTANTS.SEND_TYPES.SEND_PGP_MIME;
        email.isEO = sendPref.scheme === CONSTANTS.SEND_TYPES.SEND_EO;
        email.isPinned = sendPref.pinned;
        email.loadCryptInfo = false;
    };

    const syncWithoutFetching = (model, scope, onUpdate, data = null) => {
        const list = model.all();
        const emails = extendPGPFromOldData(list, data || scope.emails);

        addLoadingFlags(emails);

        scope.$applyAsync(() => {
            scope.emails = emails;
            scope.list = list;
            dispatcher.autocompleteEmails('refresh', { messageID: scope.message.ID });
            onUpdate();
        });

        return emails;
    };

    const handleMissingPrimaryKeys = async (transList, model) => {
        if (_.every(_.map(transList, 'primaryPinned'))) {
            return transList;
        }

        const pairs = _.toPairs(transList);
        const missingPrimKeys = pairs.filter(([, { primaryPinned }]) => !primaryPinned);
        const pinned = await autoPinPrimaryKeys.confirm(missingPrimKeys.map(([adr]) => adr));

        if (pinned) {
            // fixed automatically
            return transList;
        }

        missingPrimKeys.forEach(([adr]) => model.remove({ Address: adr }));
        return _.fromPairs(pairs.filter(([, { primaryPinned }]) => primaryPinned));
    };

    const handleInvalidSigs = async (transList, model) => {
        if (_.every(_.map(transList, 'isVerified'))) {
            return transList;
        }

        const pairs = _.toPairs(transList);
        const invalidSigs = pairs.filter(([, { isVerified }]) => !isVerified);
        const resigned = await autoPinPrimaryKeys.resign(invalidSigs.map(([adr]) => adr));

        if (resigned) {
            // fixed automatically
            return transList;
        }

        invalidSigs.forEach(([adr]) => model.remove({ Address: adr }));
        return _.fromPairs(pairs.filter(([, { primaryPinned }]) => primaryPinned));
    };

    const generate = (scope, model, onUpdate) => {
        const throttleSync = _.throttle(
            (scope, emails, model) =>
                sendPreferences
                    .get(_.map(emails, 'Address'), scope.message)
                    .then((transList) => handleInvalidSigs(transList, model, scope))
                    .then((transList) => handleMissingPrimaryKeys(transList, model, scope))
                    .then((result) => _.each(emails, (email) => result[email.Address] && extendPGP(email, result[email.Address])))
                    .then(() => syncWithoutFetching(model, scope, _.noop, emails)),
            THROTTLING_DELAY
        );

        return (forceRefresh = false) =>
            scope.$applyAsync(() => {
                const emails = syncWithoutFetching(model, scope, onUpdate);

                if (!forceRefresh && !_.some(emails, ({ loadCryptInfo }) => loadCryptInfo)) {
                    return;
                }

                throttleSync(scope, emails, model);
            });
    };

    return { generate };
}

export default autocompleteSyncModel;
