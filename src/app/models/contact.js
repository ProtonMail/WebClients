angular.module("proton.models.contact", [])

.factory("Contact", function($resource, authentication) {

    var Contact = $resource(
        authentication.baseURL + "/contacts/:id",
        authentication.params({id: "@id"}),
        {
            edit: {
                method: 'put',
                url: authentication.baseURL + "/contacts/:id"
            },
            save: {
                method: 'post',
                url: authentication.baseURL + "/contacts/",
                isArray: true
            },
            delete: {
                method: 'put',
                url: authentication.baseURL + "/contacts/delete",
                isArray: true
            }
        }
    );

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
