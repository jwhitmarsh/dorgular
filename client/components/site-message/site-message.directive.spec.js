'use strict';

describe('Directive: siteMessage', function () {

    // load the directive's module and view
    beforeEach(module('dorgularApp'));
    beforeEach(module('components/site-message/site-message.html'));

    var scope;

    beforeEach(inject(function ($rootScope) {
        scope = $rootScope.$new();
    }));

    //it('should make hidden element visible', inject(function ($compile) {
    //  element = angular.element('<site-message></site-message>');
    //  element = $compile(element)(scope);
    //  scope.$apply();
    //  expect(element.text()).toBe('this is the siteMessage directive');
    //}));
});
