var c = require('../gulpfile.config');
var config = new c();
var gulp = require('gulp');
var merge = require('merge2');
var ts = require('gulp-typescript');

gulp.task('build', function() {

    var tsResult = gulp.src(config.tsSrc)
        .pipe(ts(config.tsConfig));

    return merge([
        tsResult.dts.pipe(gulp.dest(config.dist)),
        tsResult.js.pipe(gulp.dest(config.dist))
    ]);
});