angular.module('proton.composer')
  .factory('composerRequestModel', (Message, $q) => {

      const MAP_REQUEST = {};

    /**
     * Get the list of requests for a composer
     * @param  {Number} key uid
     * @return {Array}
     */
      const read = (key) => MAP_REQUEST[`key.${key}`] || [];

    /**
     * Clear map for a message
     * @param  {Number} options.uid
     * @return {void}
     */
      const clear = ({ uid }) => {
          delete MAP_REQUEST[`key.${uid}`];
      };

    /**
     * Save a new pending request for a message
     * @param  {Message} message
     * @param  {Promise} promise
     * @return {void}
     */
      const save = (message, promise) => {
          const key = `key.${message.uid}`;
          MAP_REQUEST[key] = MAP_REQUEST[key] || [];
          MAP_REQUEST[key].push(promise);
      };

    /**
     * Resolve all the previous promises and allow chaining
     * @param  {Number}   options.uid
     * @return {Array}              $q.all
     */
      const chain = ({ uid }) => {
          const list = read(uid).map(({ promise }) => promise);
          return $q.all(list);
      };

      return { save, clear, chain };
  });
