'use strict';

angular.module('dorgularApp')
    .service('MainService', ['$http', 'SiteMessageService', function ($http, SiteMessageService) {
        var self = this;

        self.activeHost = null;

        self.setActiveHost = function (host) {
            self.activeHost = host;
        };

        self.saveHost = function (host) {
            if (host._id) {
                SiteMessageService.addMessage('updating host', 3);
                _updateHost(host);
            } else {
                SiteMessageService.addMessage('adding new host', 3);
                _addHost(host);
            }
        };

        self.deleteHost = function () {
            $http.delete('/api/hosts/' + self.activeHost._id)
                .success(_apiCallSuccess)
                .error(_apiCallError);
        };


        self.resetNewHost = function (site) {
            site.active = false;
            site.name = '';
            site.port = '';
            site.directory = '';
        };

        function _addHost(host) {
            $http.post('/api/hosts', host)
                .success(function (data) {
                    _apiCallSuccess(data);
                    self.resetNewHost(host);
                })
                .error(_apiCallError);
        }

        function _updateHost(host) {
            $http.put('', host)
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
