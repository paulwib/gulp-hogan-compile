/**
* Compile hogan templates into a js file
*/
var through = require('through');
var os = require('os');
var path = require('path');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var File = gutil.File;
var hogan = require('hogan-updated');

module.exports = function(fileName, opt) {
    if (!fileName) {
        throw new PluginError('gulp-hogan-compile',  'Missing fileName option for gulp-hogan-compile');
    }
    if (!opt) {
        opt = {};
    }
    if (!opt.newLine) {
        opt.newLine = gutil.linefeed;
    }

    var buffer = [],
        firstFile = null,
        templateName,
        compiledTemplate,
        jsString;

    function bufferContents(file) {
        if (file.isNull()) {
            return; // ignore
        }
        if (file.isStream()) {
            return this.emit('error', new PluginError('gulp-hogan-compile',  'Streaming not supported'));
        }
        if (!firstFile) {
            firstFile = file;
        }
        templateName = path.basename(file.relative, path.extname(file.relative));
        compiledTemplate  = hogan.compile(file.contents.toString('utf8'), { asString: true });
        jsString = '    templates["' + templateName + '"] = new hogan.Template(' + compiledTemplate + ');';
        buffer.push(jsString);
    }

    function endStream(){
        if (buffer.length === 0) {
            return this.emit('end');
        }
        // AMD header
        buffer.unshift("define(function(require) {");
        buffer.unshift("    var hogan = require('hogan');");
        buffer.unshift("    var templates = {};");

        // Footer
        buffer.push("    return templates;" + opt.newLine);
        buffer.push("})");

        this.emit('data', new File({
            cwd: firstFile.cwd,
            base: firstFile.base,
            path: path.join(firstFile.base, fileName),
            contents: new Buffer(buffer.join(opt.newLine))
        }));

        this.emit('end');
    }

    return through(bufferContents, endStream);
};
