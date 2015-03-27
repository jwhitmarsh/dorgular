/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Host = require('./host.model');

exports.register = function (socket) {
    Host.schema.post('save', function (doc) {
        onSave(socket, doc);
    });
    Host.schema.post('remove', function (doc) {
        onRemove(socket, doc);
    });
}

function onSave(socket, doc, cb) {
    socket.emit('host:save', doc);
}

function onRemove(socket, doc, cb) {
    socket.emit('host:remove', doc);
}
