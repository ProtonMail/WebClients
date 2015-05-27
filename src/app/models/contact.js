angular.module("proton.models.contact", [])

.factory("Contact", function($resource, authentication) {
    var Contact = $resource(
        authentication.baseURL + "/contacts/:ContactID",
        authentication.params({
            ContactID: "@ContactID"
        }), {
            query: {
                method: "get",
                isArray: true,
                transformResponse: function(data) {
                    var contacts = JSON.parse(data).Contacts;
                    Contact.index.updateWith(contacts);
                    return contacts;
                }
            },
            delete: {
                method: "delete",
                isArray: false
            },
            get: {
                method: "get",
                isArray: false,
                transformResponse: function(data) {
                    return JSON.parse(data).data;
                }
            },
            update: {
                method: "put",
                isArray: false
            },
            import: {
                method: "POST",
                url: authentication.baseURL + "/contacts/import"
            }
        });

    Contact.index = new Bloodhound({
        name: "contacts",
        local: [],
        datumTokenizer: function(datum) {
            return _.union(
                Bloodhound.tokenizers.whitespace(datum.ContactEmail),
                Bloodhound.tokenizers.whitespace(datum.ContactName)
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
