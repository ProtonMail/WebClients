angular.module('proton.models.contact', [])

.factory('Contact', function($http, url) {

    var Contact = {
        query: function() {
            return $http.get(url.get() + '/contacts');
        },
        edit: function(contact) {
            return $http.put(url.get() + '/contacts/' + contact.id, contact);
        },
        save: function(contact) {
            return $http.post(url.get() + '/contacts', contact);
        },
        delete: function(contact) {
            return $http.put(url.get() + '/contacts/delete', contact);
        },
        clear: function() {
            return $http.delete(url.get() + '/contacts');
        }
    };

    return Contact;
});
