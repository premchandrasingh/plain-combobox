var gulp = require('gulp'),
    fs = require('fs'),
    uglify = require('gulp-uglify'),
    modifyFile = require('gulp-modify-file'),
    rename = require("gulp-rename"),
    clean = require('gulp-clean'),
    cleanCSS = require('gulp-clean-css');

var bower = JSON.parse(fs.readFileSync('./bower.json'));
var signature = `/*!\n* plain-combobox ${bower.version}\n* ${bower.homepage}\n* Copyright ${new Date().getFullYear()} @ Prem\n* Contributors :- ${bower.authors[0]}\n* Licensed under: MIT (http://www.opensource.org/licenses/MIT)\n*/\n\n`;

gulp.task('dist', ['dist-css'], function () {
    // Build Uncompress version
    gulp.src('./src/plain-combobox.js')
        .pipe(modifyFile(function (content, path, file) {
            return `${signature}${content}`;
        }))
        .pipe(gulp.dest('./dist'));

    // Build Compress version
    return gulp.src('./src/plain-combobox.js')
        .pipe(uglify())
        .pipe(modifyFile(function (content, path, file) {
            return `${signature}${content}`;
        }))
        .pipe(rename('plain-combobox.min.js'))
        .pipe(gulp.dest('./dist'));
});

gulp.task('dist-css', ['clean'], function () {
    gulp.src(['./src/plain-combobox.css'])
        .pipe(gulp.dest('./dist'));

    return gulp.src('./src/plain-combobox.css')
        .pipe(cleanCSS())
        .pipe(rename('plain-combobox.min.css'))
        .pipe(gulp.dest('./dist'));
})

gulp.task('clean', [], function () {
    return gulp.src('./dist').pipe(clean());
});



