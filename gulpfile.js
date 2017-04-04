var gulp = require('gulp');
var inject = require('gulp-js-html-inject');

gulp.task('js', function () {
    return gulp.src('./src/plain-combobox.js')
        .pipe(inject())
        .pipe(gulp.dest('./dist'));
});