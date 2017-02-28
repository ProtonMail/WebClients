angular.module('proton.commons')
.factory('IncomingDefault', ($http, url) => {
    const requestURL = url.build('incomingdefaults');


    /**
     * Get all default rules
     */
    const get = () => $http.get(requestURL());

    /**
     * Create a new default rule
     */
    const add = (params) => $http.post(requestURL(), params);

    /**
    * Update a rule
    */
    const update = (opt = {}) => $http.put(requestURL(opt.ID), opt);

    /**
    * Delete rule(s)
    */
    const destroy = (params) => $http.put(requestURL('delete'), params);
    const clear = () => $http.delete(requestURL());

    return { get, add, update, delete: destroy, clear };
});
