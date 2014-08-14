angular.module("proton.Models", [
  "ngResource",
  "proton.Auth"
])

.factory("Contact", function($resource, authentication) {
  return $resource(authentication.baseURL + "/contacts/:ContactID", authentication.params(), {
    query: {
      method: "get",
      isArray: true,
      transformResponse: function (data) {
        return JSON.parse(data).Contacts;
      }
    },
    delete: {
      method: "delete",
      isArray: false,
      params: {"ContactID": "@ContactID"}
    }
  });
})

.factory("Message", function($resource, authentication) {
  function Message() {

  }

  return Message;
})

.factory("OutsideMessage", function($resource, authentication) {
  function OutsideMessage() {

  }

  return OutsideMessage;
})

.factory("User", function($resource, $injector) {
  var authentication = $injector.get("authentication");
  return $resource(authentication.baseURL + "/users", authentication.params(), {
    get: {
      method: 'get',
      isArray: false,
      transformResponse: function (data) {
        return JSON.parse(data);
      }
    }
  });
});
