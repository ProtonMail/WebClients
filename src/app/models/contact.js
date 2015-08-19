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
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        datumTokenizer: function(datum) {
            var datas = _.union(
                Bloodhound.tokenizers.whitespace(datum.Email),
                Bloodhound.tokenizers.whitespace(datum.Name)
            );

            _.each(datas, function(data) {
                    var i = 0;

                    while((i + 1) < data.length) {
                        datas.push(data.substr(i, data.length));
                        i++;
                    }
            });

            return datas;
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
