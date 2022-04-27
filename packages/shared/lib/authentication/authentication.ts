import createAuthentication from './createAuthenticationStore';
import createSecureSessionStorage from './createSecureSessionStorage';

const authentication = createAuthentication(createSecureSessionStorage());

export default authentication;
