angular.module('proton.utils')
  .filter('capitalize', () => {
      return function (value = '') {

          if (value) {
              return angular.uppercase(value).substring(0, 1) + angular.lowercase(value).substring(1);
          }

          return value;
      };
  });
