import createAuthenticationStore from 'proton-shared/lib/authenticationStore';

/* @ngInject */
function authenticationStore(secureSessionStorage) {
    return createAuthenticationStore(secureSessionStorage);
}

export default authenticationStore;
