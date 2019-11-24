var test = require('tape');
var path = require('path');
var Vinyl = require('vinyl');
var Buffer = require('buffer').Buffer;
var compile = require('../');

/**
 * Helper to make a fake file
 */
function getFakeFile(path, content) {
    return new Vinyl({
        cwd: '',
        base: 'test/',
        path: path,
        contents: new Buffer.from(content)
    });
}

test('compile templates into one file', function(t) {
    t.plan(7);

    var stream = compile('test.js');
    stream.on('data', function(newFile){
        var newFilePath = path.resolve(newFile.path);
        var expectedFilePath = path.resolve('test/test.js');

        t.ok(newFile);
        t.ok(newFile.path);
        t.ok(newFile.relative);
        t.ok(newFile.contents);
        t.is(path.resolve(newFile.path), path.resolve('test/test.js'));
        t.is(newFile.relative, 'test.js');
        t.is(Buffer.isBuffer(newFile.contents), true);
    });

    stream.write(getFakeFile('test/file1.js', 'hello {{place}}'));
    stream.write(getFakeFile('test/file2.js', '{{greeting}} world'));
    stream.end();
});

test('use options.newLine', function(t) {
    t.plan(1);

    var stream = compile('test.js', {
        newLine: '\r\n'
    });
    stream.on('data', function(newFile){
        var lines = newFile.contents.toString().split('\r\n');
        t.is(lines.length, 7);
    });
    stream.write(getFakeFile('test/file1.js', 'hello {{place}}'));
    stream.write(getFakeFile('test/file2.js', '{{greeting}} world'));
    stream.end();
});

test('compile string templates to AMD modules', function(t) {
    t.plan(7);

    var stream = compile('test.js');
    stream.on('data', function(newFile){
        var lines = newFile.contents.toString().split('\n');
        t.is(lines[0], ('define(function(require) {'));
        t.is(lines[1], ('    var Hogan = require(\'hogan\');'));
        t.is(lines[2], ('    var templates = {};'));
        t.ok(lines[3].match(/templates\['foo\/file1'\] = new Hogan.Template/));
        t.ok(lines[4].match(/templates\['file2'\] = new Hogan.Template/));
        t.is(lines.pop(), ('})'));
        t.is(lines.pop(), ('    return templates;'));
    });
    stream.write(getFakeFile('test/foo/file1.js', 'hello {{place}}'));
    stream.write(getFakeFile('test/file2.js', '{{greeting}} world'));
    stream.end();
});

test('compile string templates to commonjs modules', function(t) {
    t.plan(7);

    var stream = compile('test.js', {
        wrapper: 'commonjs'
    });
    stream.on('data', function(newFile){
        var lines = newFile.contents.toString().split('\n');
        t.is(lines[0], ('module.exports = (function() {'));
        t.is(lines[1], ('    var Hogan = require(\'hogan\');'));
        t.is(lines[2], ('    var templates = {};'));
        t.ok(lines[3].match(/templates\['file1'\] = new Hogan.Template/));
        t.ok(lines[4].match(/templates\['file2'\] = new Hogan.Template/));
        t.is(lines.pop(), ('})();'));
        t.is(lines.pop(), ('    return templates;'));
    });
    stream.write(getFakeFile('test/file1.js', 'hello {{place}}'));
    stream.write(getFakeFile('test/file2.js', '{{greeting}} world'));
    stream.end();
});

test('allow passing an object to populate with templates instead of a filename', function(t) {
    t.plan(2);
    var templates = {};
    var stream = compile(templates);
    stream.on('end', function(newFile) {
        var result1 = templates.file1.render({ place: 'world'});
        var result2 = templates.file2.render({ greeting: 'hello'})
        t.is(result1, 'hello world');
        t.is(result2, 'hello world');
    });
    stream.write(getFakeFile('test/file1.js', 'hello {{place}}'));
    stream.write(getFakeFile('test/file2.js', '{{greeting}} world'));
    stream.end();
});

test('pass options to the hogan rendering engine', function(t) {
    t.plan(1);
    var templates = {};
    var stream = compile(templates, {
        templateOptions: {
            delimiters: '<% %>'
        }
    });
    stream.on('end', function(newFile) {
        var result = templates.file3.render({ greeting: 'hello'});
        t.is(result, 'hello world');
    });
    stream.write(getFakeFile('test/file3.js', '<% greeting %> world'));
    stream.end();
});

test('names templates after relative path and basename without extension', function(t) {
    t.plan(3);

    var templates = {};
    var stream = compile(templates);
    stream.on('end', function(newFile) {
        t.is(typeof templates['pages/file1'], 'object');
        t.is(typeof templates['partials/file2'], 'object');
        t.is(typeof templates['views/special/file2'], 'object');
    });
    stream.write(getFakeFile('test/pages/file1.js', 'hello {{place}}'));
    stream.write(getFakeFile('test/partials/file2.js', '{{greeting}} world'));
    stream.write(getFakeFile('test/views/special/file2.js', '{{greeting}} world'));
    stream.end();
});

test('customize template variable name', function(t) {
    t.plan(2);

    var stream = compile('test.js', {
        templatesVariableName: 'customTemplates'
    });
    stream.on('data', function(newFile){
        var lines = newFile.contents.toString().split('\n');
        t.is(lines[2], ('    var customTemplates = {};'));
        t.is(lines[lines.length -2], ('    return customTemplates;'));
    });
    stream.write(getFakeFile('test/foo/file1.js', 'hello {{place}}'));
    stream.write(getFakeFile('test/file2.js', '{{greeting}} world'));
    stream.end();
});

test('emit end when no files are passed through the stream', function(t) {
    t.plan(1);

    var stream = compile('test.js');
    stream.on('end', function(newFile) {
        t.ok(typeof newFile === 'undefined');
    });
    stream.end();
});
