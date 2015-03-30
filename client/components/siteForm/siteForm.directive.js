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
                    var $this = $(e.target),
                        site = $this.scope().site;

                    _checkPortNotReserved(site);
                };


                function _checkPortNotReserved(site) {
                    scope.getReservedPorts()
                        .then(function (res) {
                            if (res.data.status) {
                                var reservedPorts = res.data.data;
                                for (var i = 0; i < reservedPorts.length; i++) {
                                    console.log('%s : $s', site.port, reservedPorts[i]);
                                    if (site.port === reservedPorts[i]) {
                                        site.port.$valid = false;
                                        break;
                                    }
                                }
                            }
                        });
                }

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
                                    console.log('reserved port');
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
