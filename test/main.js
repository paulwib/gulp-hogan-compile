var compile = require('../');
var should = require('should');
var os = require('os');
var path = require('path');
var File = require('gulp-util').File;
var Buffer = require('buffer').Buffer;
require('mocha');

describe('gulp-compile-hogan', function() {
  describe('compile()', function() {
    it('should compile string templates to javascript', function(done) {
      var stream = compile("test.js");
      var fakeFile = new File({
        cwd: "/home/contra/",
        base: "/home/contra/test",
        path: "/home/contra/test/file.js",
        contents: new Buffer("wadup")
      });

      var fakeFile2 = new File({
        cwd: "/home/contra/",
        base: "/home/contra/test",
        path: "/home/contra/test/file2.js",
        contents: new Buffer("doe")
      });

      stream.on('data', function(newFile){
        should.exist(newFile);
        should.exist(newFile.path);
        should.exist(newFile.relative);
        should.exist(newFile.contents);

        var newFilePath = path.resolve(newFile.path);
        var expectedFilePath = path.resolve("/home/contra/test/test.js");
        newFilePath.should.equal(expectedFilePath);

        newFile.relative.should.equal("test.js");
        String(newFile.contents).should.match(/templates\["file"\]/);
        String(newFile.contents).should.match(/templates\["file2"\]/);
        String(newFile.contents).should.match(/new hogan.Template\(\{/);
        Buffer.isBuffer(newFile.contents).should.equal(true);
        done();
      });
      stream.write(fakeFile);
      stream.write(fakeFile2);
      stream.end();
    });

  });
});
