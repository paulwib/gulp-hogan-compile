/**
 * Compile hogan templates into a js file
 */

'use strict';

var through = require('through');
var os = require('os');
var path = require('path');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var File = gutil.File;
var hogan = require('hogan.js');
var extend = require('extend');

module.exports = function(fileName, options) {
    if (!fileName) {
        throw new PluginError('gulp-hogan-compile',  'Missing fileName argument for gulp-hogan-compile');
    }
    options = extend(true, {
        newLine: gutil.linefeed,
        wrapper: 'amd',
        templateOptions: {
            asString: true
        },
        templateName: function(file) {
            return path.basename(file.relative, path.extname(file.relative));
        },
        hoganModule: 'hogan'
    }, options || {});

    var templates = {},
        firstFile = null;

    function bufferContents(file) {
        if (file.isNull()) {
            return;
        }
        if (file.isStream()) {
            return this.emit('error', new PluginError('gulp-hogan-compile',  'Streaming not supported'));
        }
        if (!firstFile) {
            firstFile = file;
        }
        templates[options.templateName(file)] = hogan.compile(file.contents.toString('utf8'), options.templateOptions);
    }

    function endStream(){
        if (templates.length === 0) {
            return this.emit('end');
        }

        var lines = [];
        for (var name in templates) {
            lines.push('    templates[\'' + name + '\'] = new Hogan.Template(' + templates[name] + ');');
        }
        // Unwrapped
        lines.unshift('    var templates = {};');

        // All wrappers require a hogan module
        if (options.wrapper) {
            lines.unshift('    var Hogan = require(\'' + options.hoganModule  + '\');');
            lines.push('    return templates;');
        }
        // AMD wrapper
        if (options.wrapper === 'amd') {
            lines.unshift('define(function(require) {');
            lines.push('})');
        }
        // CommonJS wrapper
        else if (options.wrapper === 'commonjs') {
            lines.unshift('module.exports = (function() {');
            lines.push('})();');
        }

        this.emit('data', new File({
            cwd: firstFile.cwd,
            base: firstFile.base,
            path: path.join(firstFile.base, fileName),
            contents: new Buffer(lines.join(options.newLine))
        }));

        this.emit('end');
    }

    return through(bufferContents, endStream);
};
