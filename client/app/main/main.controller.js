'use strict';

angular.module('dorgularApp')
    .controller('MainCtrl', ['$scope', '$http', 'socket', 'SiteMessageService', function ($scope, $http, socket, SiteMessageService) {

        // general vars
        $scope.dorasTag = '4.0.0';

        $scope.doraUpToDate = true;

        $scope.gitHubAuthorized = false;

        $scope.hosts = [];

        $scope.activeHost = null;

        $scope.newHost = {
            name: '',
            port: '',
            directory: '',
            active: true
        };

        // ui methods
        $scope.filterHosts = function (e) {
            var filter = $(e.target).val().toLowerCase();

            if (filter.length > 0) {
                for (var i = 0; i < $scope.hosts.length; i++) {
                    var host = $scope.hosts[i];
                    var nameMatch = host.name.toLowerCase().indexOf(filter) >= 0;
                    var portMatch = host.port.toString().indexOf(filter) >= 0;

                    host.include = !!(nameMatch === true || portMatch === true);
                }
            } else {
                for (var j = 0; j < $scope.hosts.length; j++) {
                    $scope.hosts[j].include = true;
                }
            }
        };

        // api calls
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
            for (var j = 0; j < $scope.hosts.length; j++) {
                $scope.hosts[j].include = true;
            }
            socket.syncUpdates('host', $scope.hosts);
        });

        $scope.addHost = function (host) {
            $http.post('/api/hosts', host)
                .success(_apiCallSuccess)
                .error(_apiCallError);
        };

        $scope.setActiveHost = function (host) {
            $scope.activeHost = host;
        };

        $scope.deleteHost = function () {
            $http.delete('/api/hosts/' + $scope.activeHost._id)
                .success(_apiCallSuccess)
                .error(_apiCallError);
        };

        $scope.closeNewForm = function (site) {
            site.active = false;
            site.name = '';
            site.port = '';
            site.directory = '';
        };

        $scope.$on('$destroy', function () {
            socket.unsyncUpdates('host');
        });

        function _apiCallSuccess(data) {
            console.log(data);
            if (data.status) {
                SiteMessageService.addMessage(data.msg, 1);
            } else {
                SiteMessageService.addMessage(data.msg, 2);
            }
        }

        function _apiCallError(data) {
            console.error(data);
            SiteMessageService.addMessage(data.toString(), 2);
        }
    }]);
