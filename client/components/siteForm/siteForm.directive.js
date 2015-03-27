'use strict';

angular.module('dorgularApp')
    .directive('siteForm', function () {
        return {
            templateUrl: 'components/siteForm/siteForm.html',
            restrict: 'EA',
            link: function (scope, element) {
                var container = element.find('.site-form');
                container.hide();

                scope.$watch('host.active', function (active) {
                    if (active) {
                        container.slideDown();

                        var elementTop = container.offset().top;
                        var elementHeight = container.height();

                        if ($(window).height() < (elementTop + elementHeight)) {
                            $('body').animate({
                                scrollTop: elementTop - 40
                            }, 'slow');
                        }
                    } else {
                        container.slideUp();
                    }
                });
            }
        };
    });
