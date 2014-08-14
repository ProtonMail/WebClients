angular.module("proton.Models", [
  "ngResource",
  "proton.Auth"
])

.factory("Contact", function($resource, authentication) {
  var Contact = $resource()

  return Contact;
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
        return _.transform(JSON.parse(data), function (data, value, key){
          data[key[0].toLowerCase() + key.slice(1)] = value;
        });
      }
    }
  });
});
