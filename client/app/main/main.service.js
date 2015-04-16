'use strict';

angular.module('dorgularApp')
    .service('MainService', ['$http', 'SiteMessageService', function ($http, SiteMessageService) {
        var self = this;

        self.reservedPorts = [];

        self.directories = [];

        self.activeHost = null;

        self.setActiveHost = function (host) {
            self.activeHost = host;
        };

        self.resetNewHost = function (site) {
            site.active = false;
            site.name = '';
            site.port = '';
            site.directory = '';
        };

        // api calls
        self.save = function (host) {
            console.log(host);
            if (host._id) {
                SiteMessageService.addMessage('updating host', 3);
                _updateHost(host);
            } else {
                SiteMessageService.addMessage('adding new host', 3);
                _addHost(host);
            }
        };

        self.delete = function (site) {
            console.log('deleting host', site);
            $http.delete('/api/hosts/' + site._id)
                .success(_apiCallSuccess)
                .error(_apiCallError);
        };

        self.sync = function (site) {
            $http.get('/api/hosts/sync/' + site._id)
                .success(_apiCallSuccess)
                .error(_apiCallError);
        };

        self.syncAll = function () {
            $http.get('/api/hosts/sync/')
                .success(_apiCallSuccess)
                .error(_apiCallError);
        };

        self.getReservedPorts = function () {
            return $http.get('/api/hosts/reservedPorts', {cache: true})
                .error(_apiCallError);
        };

        self.getDirectories = function (path) {
            return $http.post('/api/utilities/directories', {path: path})
                .error(_apiCallError);
        };

        // privates
        function _addHost(host) {
            $http.post('/api/hosts/', host)
                .success(function (data) {
                    _apiCallSuccess(data);
                    if (data.status) {
                        self.resetNewHost(host);
                    }
                })
                .error(_apiCallError);
        }

        function _updateHost(host) {
            $http.put('/api/hosts/' + host._id, host)
                .success(_apiCallSuccess)
                .error(_apiCallError);
        }

        function _apiCallSuccess(data) {
            if (data.status) {
                SiteMessageService.addMessage(data.msg, 1);
            } else {
                SiteMessageService.addMessage(data.msg, 2);
            }
        }

        function _apiCallError(data) {
            SiteMessageService.addMessage(data.toString(), 2);
        }
    }]);
