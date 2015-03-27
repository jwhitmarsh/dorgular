'use strict';

angular.module('dorgularApp')
    .directive('siteMessage', ['$rootScope', function ($rootScope) {
        var messageContainer;

        return {
            templateUrl: 'components/site-message/site-message.html',
            restrict: 'E',
            scope: true,
            link: function (scope, element) {
                messageContainer = element.find('.message-container');
                messageContainer.hide();

                var _unregister;

                _unregister = $rootScope.$on('site-message', function (event, message) {
                    scope.message = message;
                    messageContainer.fadeIn();
                });

                scope.$on('$destroy', _unregister);

                scope.dismiss = function () {
                    messageContainer.fadeOut();
                };
            }
        };
    }]);
