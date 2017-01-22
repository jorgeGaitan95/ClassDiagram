/* required methods*/
var gulp= require('gulp');
var browserSync= require('browser-sync').create();
var reload = browserSync.reload;

gulp.task('serve', function() {
  browserSync.init({
    server: {
      baseDir: 'app'
    },
    online: true
  });
  gulp.watch(['*.html', 'templates/**/*.html','css/**/*.css', 'js/**/*.js'], {cwd: 'app'}, reload);
});
