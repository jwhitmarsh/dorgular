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

                scope.site.uid = scope.$id;

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
                    console.log(scope['hostForm' + site.uid].name.$error);
                    if (scope['hostForm' + site.uid].$valid) {
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
    .directive('portValidator', function () {
        return {
            require: 'ngModel',
            link: function (scope, element, attrs, ctrl) {
                ctrl.$validators.port = function (modelValue) {
                    var reservedPorts = scope.reservedPorts;

                    if (ctrl.$isEmpty(modelValue)) {
                        // consider empty model valid
                        return true;
                    }

                    for (var i = 0; i < reservedPorts.length; i++) {
                        if (modelValue === reservedPorts[i]) {
                            console.log('reserved port');
                            return false;
                        }
                    }

                    return true;
                };
            }
        };
    });
