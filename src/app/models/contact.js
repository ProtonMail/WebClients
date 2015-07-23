angular.module("proton.models.contact", [])

.factory("Contact", function($http, url) {

    var Contact = {
        get: function() {
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

    Contact.index = new Bloodhound({
        name: "contacts",
        local: [],
        datumTokenizer: function(datum) {
            return _.union(
                Bloodhound.tokenizers.whitespace(datum.Email),
                Bloodhound.tokenizers.whitespace(datum.Name)
            );
        },
        queryTokenizer: function(datum) {
            return Bloodhound.tokenizers.whitespace(datum);
        }
    });

    _.extend(Contact.index, {
        updateWith: function(list) {
            Contact.index.clear();
            Contact.index.add(list);
        }
    });

    Contact.index.initialize();

    return Contact;
});
