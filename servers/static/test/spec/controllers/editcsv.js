'use strict';

describe('Controller: EditcsvCtrl', function () {

  // load the controller's module
  beforeEach(module('staticApp'));

  var EditcsvCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    EditcsvCtrl = $controller('EditcsvCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
