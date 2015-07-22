angular.module("proton.models.contact", [])

.factory("Contact", function($http, $rootScope) {

    var Contact = {
        get: function() {
            return $http.get($rootScope.baseURL + '/contacts');
        },
        edit: function(contact) {
            return $http.put($rootScope.baseURL + '/contacts/' + contact.id, contact);
        },
        save: function(contact) {
            return $http.post($rootScope.baseURL + '/contacts', contact);
        },
        delete: function(contact) {
            return $http.put($rootScope.baseURL + '/contacts/delete', contact);
        },
        clear: function() {
            return $http.delete($rootScope.baseURL + '/contacts');
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
