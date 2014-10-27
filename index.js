/**
* Compile hogan templates into a js file
*/
var through = require('through');
var os = require('os');
var path = require('path');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var File = gutil.File;
var hogan = require('hogan.js');
var _ = require('lodash');

module.exports = function(fileName, options) {
    if (!fileName) {
        throw new PluginError('gulp-hogan-compile',  'Missing fileName argument for gulp-hogan-compile');
    }
    options = _.assign({
        newLine: gutil.linefeed,
        wrapper: 'amd',
        templateOptions: {},
        templateName: function(file) {
            return path.basename(file.relative, path.extname(file.relative));
        },
        hoganModule: 'hogan'
    }, options || {});

    options.templateOptions.asString = true;

    var buffer = [],
        firstFile = null,
        templateName,
        compiledTemplate,
        jsString;

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
        templateName = options.templateName(file);
        compiledTemplate  = hogan.compile(file.contents.toString('utf8'), options.templateOptions);
        jsString = '    templates[\'' + templateName + '\'] = new Hogan.Template(' + compiledTemplate + ');';
        buffer.push(jsString);
    }

    function endStream(){
        if (buffer.length === 0) {
            return this.emit('end');
        }
        // Unwrapped
        buffer.unshift("    var templates = {};");

        // All wrappers require a hogan module
        if (options.wrapper) {
            buffer.unshift("    var Hogan = require('" + options.hoganModule  + "');");
            buffer.push("    return templates;");
        }
        // AMD wrapper
        if (options.wrapper === 'amd') {
            buffer.unshift("define(function(require) {");
            buffer.push("})");
        }
        // CommonJS wrapper
        else if (options.wrapper === 'commonjs') {
            buffer.unshift("module.exports = (function() {");
            buffer.push("})();");
        }

        this.emit('data', new File({
            cwd: firstFile.cwd,
            base: firstFile.base,
            path: path.join(firstFile.base, fileName),
            contents: new Buffer(buffer.join(options.newLine))
        }));

        this.emit('end');
    }

    return through(bufferContents, endStream);
};
