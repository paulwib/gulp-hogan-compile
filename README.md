A [gulp][] plugin to compile [mustache][] HTML templates to JavaScript functions using [hogan][].

## Usage

In `templates/test.html`:

```html
<p>Hello {{place}}</p>
```

In your gulpfile:

```javascript
var compiler = require('gulp-hogan-compile');

gulp.task('templates', function() {
    gulp.src('templates/**/*.html')
        .pipe(compiler('templates.js'))
        .pipe(gulp.dest('js/'));
});
```

In your code:

```javascript
    var templates = require('js/templates.js');
    var html = templates.test.render({
        place: 'world';
    })
    console.log(html); // <p>Hello world</p>
```

This will compile the templates into a JavaScript AMD module using `hogan.compile`.

It will `require('hogan')` so that module needs to be available, for example by installing it with [bower][]. You can change the name/path of the hogan module at compile time  with `options.hoganModule`.

Alternatively you can pass an object to have it populated with executable templates, which is useful if you need templates as part of a build step, for example:

```javascript
var compiler = require('gulp-hogan-compile');
var templates = {};

gulp.task('templates', function() {
    gulp.src('templates/**/*.html')
        .pipe(compiler(templates));
});

gulp.task('render', ['templates'], function() {
	// Do something with templates, like passing to a static site generator
});
```

## Parameters

* dest `string|object`
    * Either the name of a file or an object - if using an object it will be populated with compiled template code and no file will be outputted (so all string output related options below are ignored)
* options `object`
    * Options passed to the hogan task

## Options

### newLine `string`

The line delimiter, defaults to your operating system's newline. Ignored if `dest` is an object.

### wrapper `string`

Either `amd`, `commonjs` or `false` for no wrapper, defaults to `amd`. If wrapper is `false` a local var `templates` will be defined containing the templates. Ignored if `dest` is an object.

### templateOptions `object`

Options passed through to `hogan.compile`. `asString` will be set depending on whether output is a file or an object, any passed setting is ignored.

### templateName `function(file)`

A function that will be passed the file and should return a name for the template. By default uses the relative path and basename of the file without an extension.

### hoganModule `string`

The name of the hogan module *in your app*, defaults to `hogan`. If you're not using a wrapper then the global `Hogan` must be available.

[gulp]:http://gulpjs.com
[mustache]:http://mustache.github.io
[hogan]:https://github.com/twitter/hogan.js
[bower]:https://github.com/bower/bower
