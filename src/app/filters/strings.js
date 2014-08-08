angular.module("proton.filters.strings", [])
.filter("capitalize", function() {
  return function(input) {
    return _.string.capitalize(input);
  };
});
