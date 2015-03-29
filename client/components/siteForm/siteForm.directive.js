'use strict';

angular.module('dorgularApp')
    .directive('siteForm', function () {

        return {
            templateUrl: 'components/siteForm/siteForm.html',
            restrict: 'EA',
            scope: {
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

                scope.submit = function (site) {
                    if (scope['hostForm' + site.port].$valid) {
                        scope.saveHost(site);
                    }
                };

                scope.nameOnBlur = function (e) {
                    var $this = $(e.target),
                        site = $this.scope().site,
                        name = site.name;

                    if (site.name.length > 0) {
                        name = name.replace(/ /g, '-')
                            .replace(/-{2,}/g, '-')
                            .replace(/-$/, '');

                        site.name = name;
                    }
                };

                scope.suggestPort = function (e) {
                    var $this = $(e.target),
                        site = $this.scope().site;

                    site.port = 9899;
                };

                scope.portOnBlur = function (e) {
                    var resPorts = scope.getReservedPorts();
                    console.log(resPorts);
                };

                scope.$watch('site', true);
            }
        };
    });
