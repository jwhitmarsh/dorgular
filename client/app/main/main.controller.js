'use strict';

angular.module('dorgularApp')
    .controller('MainCtrl', ['$scope', '$http', 'socket', 'SiteMessageService', 'MainService', '$modal',
        function ($scope, $http, socket, SiteMessageService, MainService, $modal) {

            // general vars
            $scope.dorasTag = '4.0.0';

            $scope.doraUpToDate = true;

            $scope.gitHubAuthorized = false;

            $scope.hosts = [];

            $scope.activeHost = MainService.activeHost;

            $scope.newHost = {
                name: '',
                port: '',
                directory: '',
                active: false
            };

            $scope.reservedPorts = MainService.getReservedPorts;

            $scope.getDirectories = function () {
                MainService.getDirectories()
                    .success(function (data) {
                        var modalInstance = $modal.open({
                            templateUrl: 'directoryBrowser.html',
                            controller: 'DirectoryBrowserCtrl',
                            resolve: {
                                directories: function () {
                                    return data.dirs;
                                }
                            }
                        });
                    });
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
                    _includeAll();
                }
            };

            $scope.closeNewForm = MainService.resetNewHost;

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

                _includeAll();

                socket.syncUpdates('host', $scope.hosts, function () {
                    _includeAll();
                });
            });

            $scope.setActiveHost = MainService.setActiveHost;

            $scope.saveHost = MainService.saveHost;

            $scope.deleteHost = MainService.deleteHost;

            $scope.$on('$destroy', function () {
                socket.unsyncUpdates('host');
            });

            function _includeAll() {
                for (var j = 0; j < $scope.hosts.length; j++) {
                    $scope.hosts[j].include = true;
                }
            }
        }])
    .controller('DirectoryBrowserCtrl', function ($scope, $modalInstance, directories) {

        $scope.directories = directories;
        $scope.selected = {
            directories: $scope.directories[0]
        };

        $scope.ok = function () {
            $modalInstance.close($scope.selected.directories);
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };

    });
