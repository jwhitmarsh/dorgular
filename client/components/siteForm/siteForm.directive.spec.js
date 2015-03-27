'use strict';

describe('Directive: siteForm', function () {

    // load the directive's module and view
    beforeEach(module('dorgularApp'));
    beforeEach(module('components/siteForm/siteForm.html'));

    var scope;

    beforeEach(inject(function ($rootScope) {
        scope = $rootScope.$new();
    }));

    //it('should make hidden element visible', inject(function ($compile) {
    //  element = angular.element('<site-form></site-form>');
    //  element = $compile(element)(scope);
    //  scope.$apply();
    //  expect(element.text()).toBe('this is the siteForm directive');
    //}));
});
