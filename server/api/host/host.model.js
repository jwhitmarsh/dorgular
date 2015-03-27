'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var HostSchema = new Schema({
    name: String,
    port: Number,
    directory: String,
    tag: String,
    giturl: String,
    href: String,
    isIpadApp: Boolean,
    hasDocs: Boolean
});

module.exports = mongoose.model('Host', HostSchema);
