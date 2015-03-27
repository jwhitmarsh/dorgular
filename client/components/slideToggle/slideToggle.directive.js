'use strict';

angular.module('dorgularApp')
    .directive('slideToggle', function () {
        return {
            restrict: 'A',

            link: function (scope, element, attrs) {
                element.text('this is the slideToggle directive');
            }
        };
    });
