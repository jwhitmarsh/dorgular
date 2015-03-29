'use strict';

angular.module('dorgularApp')
    .directive('siteForm', function () {
        return {
            templateUrl: 'components/siteForm/siteForm.html',
            restrict: 'EA',
            scope:{
                site: '='
            },
            controller: 'MainCtrl',
            link: function (scope, element) {
                var container = element.find('.site-form');
                container.hide();

                scope.$watch('site.active', function (active) {
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

                scope.$watch('site', true);
            }
        };
    });
