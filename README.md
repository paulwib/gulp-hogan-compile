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
        .pipe(compiler('templates.js'));
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

**It uses the `hogan-updated` module**. This works with the latest version of hogan for bower (currently the npm version of hogan is `~2.0.0`, but bower is around `~3.0.0`).

## Parameters

* file `string`
    * The name of the file to use for the compiled templates
* options `object`
    * Options passed to the hogan task

## Options

### newLine `string`

The line delimiter, defaults to your operating system's newline.

### wrapper `string`

Either `amd`, `commonjs` or `false` for no wrapper, defaults to `amd`. If wrapper is `false` a local var `templates` will be defined containing the templates.

### templateOptions `object`

Option passed through to `hogan.compile`. It will always set `asString` to `true`, so you can't override that.

## templateName `function(file)`

A function that will be passed the file and should return a name for the template. By default uses the basename of the file without an extension.
