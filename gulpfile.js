var gulp = require('gulp');
var babel = require('gulp-babel');
var src_dir = './assets/js/src/*.js';

gulp.task('default', function () {
    return gulp.src(src_dir)
        .pipe(babel())
        .pipe(gulp.dest('./assets/js'));
});
gulp.task('watch', function(){
    gulp.watch(src_dir, ['default']);
});
