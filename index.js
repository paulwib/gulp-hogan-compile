'use strict';

var through = require('through');
var os = require('os');
var path = require('path');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var File = gutil.File;
var hogan = require('hogan.js');
var extend = require('extend');

/**
 * Compile hogan templates into a js file
 *
 * @param {string|object} dest - If a string will be used as a filename, if an object templates
 * will be addded to it and gulp.dest() will have no affect (and other string related settings ignored)
 * @param {object} options - see README
 */
module.exports = function(dest, options) {
    if (!dest) {
        throw new PluginError('gulp-hogan-compile',  'Missing dest argument for gulp-hogan-compile');
    }

    // Store templates directly in dest if it is an object instead of a string file name
    var templates = typeof dest === 'object' ? dest : {},
        firstFile = null;

    options = extend(true, {
        newLine: gutil.linefeed,
        wrapper: 'amd',
        templateOptions: {},
        templateName: function(file) {
            return path.join(
                path.dirname(file.relative),
                path.basename(file.relative, path.extname(file.relative))
            );
        },
        hoganModule: 'hogan'
    }, options || {});

    // Do not convert to strings if dest is an object
    options.templateOptions.asString = typeof dest !== 'object';

    return through(bufferContents, endStream);

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
        // If no templates or dest is an object nothing more to do
        if (!firstFile || typeof dest === 'object') {
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
            path: path.join(firstFile.base, dest),
            contents: new Buffer(lines.join(options.newLine))
        }));

        this.emit('end');
    }
};
