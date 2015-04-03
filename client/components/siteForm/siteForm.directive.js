'use strict';

angular.module('dorgularApp')
    .directive('siteForm', ['$q', function () {

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

                scope.site.formId = 'hostForm' + scope.$id;

                scope.$watch('site.active', function (active) {
                    if (active) {
                        if (scope.site.form) {
                            scope.site.form.$setPristine();
                        }

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
                    site.form = scope[site.formId];
                    if (site.form.$valid) {
                        scope.saveHost(site);
                    }
                };

                scope.suggestPort = function (e) {
                    var $this = $(e.target),
                        site = $this.scope().site;

                    site.port = 9899;
                };

                scope.$watch('site', true);
            }
        };
    }])
    .directive('portReservedValidator', function ($q) {

        var reservedPorts;

        return {
            require: 'ngModel',
            link: function (scope, element, attrs, ctrl) {
                ctrl.$asyncValidators.portReserved = function (modelValue) {

                    if (ctrl.$isEmpty(modelValue)) {
                        // consider empty model valid
                        return true;
                    }

                    return scope.reservedPorts().then(function (res) {
                        res = res.data;

                        if (res.status) {
                            reservedPorts = res.data;

                            for (var i = 0; i < reservedPorts.length; i++) {
                                if (modelValue === reservedPorts[i]) {
                                    return $q.reject();
                                }
                            }

                            return true;
                        }
                    });
                };
            }
        };
    });
