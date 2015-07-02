angular.module("proton.models.contact", [])

.factory("Contact", function($http, authentication) {

    var Contact = {
        get: function() {
            return $http.get(authentication.baseURL + '/contacts');
        },
        edit: function(contact) {
            return $http.put(authentication.baseURL + '/contacts/' + contact.ID, contact);
        },
        save: function(contact) {
            return $http.post(authentication.baseURL + '/contacts', contact);
        },
        delete: function(contact) {
            return $http.put(authentication.baseURL + '/contacts/delete', contact);
        },
        clear: function() {
            return $http.delete(authentication.baseURL + '/contacts');
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
