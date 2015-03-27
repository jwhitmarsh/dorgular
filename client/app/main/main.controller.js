'use strict';

angular.module('dorgularApp')
    .controller('MainCtrl', ['$scope', '$http', 'socket', 'SiteMessageService', function ($scope, $http, socket, SiteMessageService) {
        $scope.dorasTag = '4.0.0';

        $scope.doraUpToDate = true;

        $scope.gitHubAuthorized = false;

        $scope.hosts = [];

        // keep as examples
        $scope.awesomeThings = [];

        $http.get('/api/hosts').success(function (hosts) {
            $scope.hosts = hosts.sort(function (a, b) {
                var nameA = a.name.toLowerCase(),
                    nameB = b.name.toLowerCase();
                if (nameA < nameB) {
                    return -1;
                }
                if (nameA > nameB) {
                    return 1;
                }
                return 0;
            });
            socket.syncUpdates('host', $scope.hosts);
        });

        $scope.addHost = function () {
            $http.post('/api/hosts',
                {
                    name: 'test',
                    port: 55000,
                    directory: '/Users/jwhitmarsh/src/4651-ROI-TemplateUpgrade/app/'
                }
            )
                .success(function (data) {
                    console.log(data);
                    if (data.status) {
                        SiteMessageService.addMessage(data.msg, 1);
                    } else {
                        SiteMessageService.addMessage(data.msg, 2);
                    }
                })
                .error(function (data) {
                    SiteMessageService.addMessage(data.toString(), 2);
                });
        };

        $scope.deleteHost = function (id) {
            console.log(id);
        };

        $scope.$on('$destroy', function () {
            socket.unsyncUpdates('thing');
        });
    }]);
