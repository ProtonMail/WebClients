angular.module('proton.models.contact', [])

.factory('Contact', ($http, url) => {

    const Contact = {
        query() {
            return $http.get(url.get() + '/contacts');
        },
        edit(contact) {
            return $http.put(url.get() + '/contacts/' + contact.id, contact);
        },
        save(contact) {
            return $http.post(url.get() + '/contacts', contact);
        },
        delete(contact) {
            return $http.put(url.get() + '/contacts/delete', contact);
        },
        clear() {
            return $http.delete(url.get() + '/contacts');
        }
    };

    return Contact;
});
