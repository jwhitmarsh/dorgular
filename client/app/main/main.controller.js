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

            $scope.getDirectories = function (e) {
                var site = $(e.target).scope().site;

                MainService.getDirectories(site.directory)
                    .success(function (data) {
                        var modalInstance = $modal.open({
                            templateUrl: 'directoryBrowser.html',
                            controller: 'DirectoryBrowserCtrl',
                            resolve: {
                                site: function () {
                                    return site;
                                },
                                path: function () {
                                    return data.path;
                                },
                                directories: function () {
                                    return data.dirs;
                                }
                            }
                        });

                        modalInstance.result.then(function (selectedItem) {
                            site.directory = selectedItem;
                        }, function () {
                            console.info('Modal dismissed at: ' + new Date());
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
    .controller('DirectoryBrowserCtrl', function ($scope, $modalInstance, path, directories, MainService, site) {
        $scope.directories = directories;
        $scope.path = path;
        $scope.site = site;
        $scope.selected = site.directory;

        $scope.open = function (e) {
            _getDirectories($scope.path + '/' + $(e.target).text());
        };

        $scope.select = function (e) {
            $scope.selected = $scope.path + '/' + $(e.target).text();
        };

        $scope.back = function () {
            _getDirectories($scope.path.substring(0, $scope.path.lastIndexOf("/")));
        };

        $scope.ok = function () {
            // pass back the result to bind to the model
            $modalInstance.close($scope.selected);
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };

        function _getDirectories(path) {
            MainService.getDirectories(path)
                .success(function (data) {
                    $scope.path = data.path;
                    $scope.directories = data.dirs;
                });
        }
    });
