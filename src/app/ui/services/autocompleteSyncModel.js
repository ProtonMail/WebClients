import _ from 'lodash';

import extendPGP from '../../../helpers/composerIconHelper';

/* @ngInject */
function autocompleteSyncModel(sendPreferences, autoPinPrimaryKeys, dispatchers) {
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

    const syncWithoutFetching = (model, scope, data = null) => {
        const list = model.all();
        const emails = extendPGPFromOldData(list, data || scope.emails);

        addLoadingFlags(emails);

        /*
         * We want the autocompleteEmails event to resolve after the scope has been executed: otherwise the email
         * change has not been fully propagate to the elements that are receiving this change and the tooltip will get stuck
         * on "Loading encryption info...". Cf. 6953
         */
        return new Promise((resolve) => {
            scope.$applyAsync(() => {
                scope.emails = emails;
                scope.list = list;
                resolve(emails);
            });
        });
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
                    .then((result) => emails.map((email) => extendPGP(email, result[email.Address])))
                    .then((newEmails) => syncWithoutFetching(model, scope, newEmails))
                    .then(() => dispatcher.autocompleteEmails('refresh', { messageID: scope.message.ID })),
            THROTTLING_DELAY
        );

        return (forceRefresh = false) => {
            syncWithoutFetching(model, scope).then((emails) => {
                onUpdate();

                if (!forceRefresh && !_.some(emails, ({ loadCryptInfo }) => loadCryptInfo)) {
                    return;
                }

                throttleSync(scope, emails, model);
            });
        };
    };

    return { generate };
}

export default autocompleteSyncModel;
