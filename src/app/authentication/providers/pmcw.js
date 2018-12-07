import * as pmcrypto from 'pmcrypto';

/* @ngInject */
function pmcw() {

    this.$get = () => pmcrypto;
}
export default pmcw;
