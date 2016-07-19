var Mocks = function () {

   this.httpBackendMock = function() {
    angular.module('httpBackendMock', ['ngMockE2E'])
      .run(function($httpBackend) {
        console.log('Test platform bootstrapping');
        //
        // $httpBackend.whenGET('/api/auth').respond(function(method, url, data, headers) {
        //   return authenticated ? [200, testAccount, {}] : [401, {}, {}];
        // });

        $httpBackend.whenPOST(/.*/).respond(function(method, url, data, headers) {
            console.log('received');
            return False;
        });


        $httpBackend.whenGET(/.*/).respond(function(method, url, data, headers) {
            console.log('received');
            return False;
        });
        // $httpBackend.whenGET(/.*/).passThrough();
    });
  };
};

module.exports = Mocks;
