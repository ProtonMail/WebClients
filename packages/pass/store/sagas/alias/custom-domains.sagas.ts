import {
    createCustomDomainApi,
    deleteCustomDomainApi,
    getAliasDomainsApi,
    getCustomDomainInfoApi,
    getCustomDomainSettingsApi,
    getCustomDomainsApi,
    setDefaultAliasDomainApi,
    updateCatchAllApi,
    updateCustomDomainDisplayNameApi,
    updateCustomDomainMailboxesApi,
    updateRandomPrefixApi,
    verifyCustomDomainApi,
} from '../../../lib/alias/alias.requests';
import {
    createCustomDomain,
    deleteCustomDomain,
    getAliasDomains,
    getCustomDomainInfo,
    getCustomDomainSettings,
    getCustomDomains,
    setDefaultAliasDomain,
    updateCatchAll,
    updateCustomDomainDisplayName,
    updateCustomDomainMailboxes,
    updateRandomPrefix,
    verifyCustomDomain,
} from '../../actions';
import { createRequestSaga } from '../../request/sagas';

const getAliasDomainsSaga = createRequestSaga({
    actions: getAliasDomains,
    call: getAliasDomainsApi,
});

const setDefaultAliasDomainSaga = createRequestSaga({
    actions: setDefaultAliasDomain,
    call: setDefaultAliasDomainApi,
});

const getCustomDomainsSaga = createRequestSaga({
    actions: getCustomDomains,
    call: getCustomDomainsApi,
});

const getCustomDomainInfoSaga = createRequestSaga({
    actions: getCustomDomainInfo,
    call: getCustomDomainInfoApi,
});

const createCustomDomainSaga = createRequestSaga({
    actions: createCustomDomain,
    call: createCustomDomainApi,
});

const verifyCustomDomainSaga = createRequestSaga({
    actions: verifyCustomDomain,
    call: async ({ domainID, silent }) => {
        const result = await verifyCustomDomainApi(domainID);
        return { ...result, silent };
    },
});

const deleteCustomDomainSaga = createRequestSaga({
    actions: deleteCustomDomain,
    call: deleteCustomDomainApi,
});

const getCustomDomainSettingsSaga = createRequestSaga({
    actions: getCustomDomainSettings,
    call: getCustomDomainSettingsApi,
});

const updateCatchAllSaga = createRequestSaga({
    actions: updateCatchAll,
    call: updateCatchAllApi,
});

const updateCustomDomainDisplayNameSaga = createRequestSaga({
    actions: updateCustomDomainDisplayName,
    call: updateCustomDomainDisplayNameApi,
});

const updateRandomPrefixSaga = createRequestSaga({
    actions: updateRandomPrefix,
    call: updateRandomPrefixApi,
});

const updateCustomDomainMailboxesSaga = createRequestSaga({
    actions: updateCustomDomainMailboxes,
    call: updateCustomDomainMailboxesApi,
});

export default [
    getAliasDomainsSaga,
    setDefaultAliasDomainSaga,
    getCustomDomainsSaga,
    getCustomDomainInfoSaga,
    createCustomDomainSaga,
    verifyCustomDomainSaga,
    deleteCustomDomainSaga,
    getCustomDomainSettingsSaga,
    updateCatchAllSaga,
    updateCustomDomainDisplayNameSaga,
    updateRandomPrefixSaga,
    updateCustomDomainMailboxesSaga,
];
