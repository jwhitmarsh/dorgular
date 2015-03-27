'use strict';

angular.module('dorgularApp')
    .service('SiteMessageService', function ($rootScope) {
        var self = this;

        self.addMessage = function (message, status) {
            var header,
                statusClass;

            switch (status) {
                case 1:
                    statusClass = "success";
                    header = 'Wooooo :)';
                    break;
                case 2:
                    statusClass = "error";
                    header = 'Uh oh :(';
                    break;
                case 3:
                    statusClass = "loading";
                    header = "Loading...";
                    break;
                default:
                    console.error('!status expected!');
            }

            message = {
                header: header,
                body: message,
                statusClass: statusClass
            };

            $rootScope.$emit('site-message', message);
        };

        self.getMessage = function () {
            return self.message;
        };

    });
