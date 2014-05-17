'use strict';

var gulp = require('gulp'),
    // nodemon = require('gulp-nodemon'),
    jshint = require('gulp-jshint');

/*******************************************************************************
* FILE PATHS
*******************************************************************************/

var files = {
  javascript: [
    './lib/**/*.js',
    './config/**/*.js',
    './gulpfile.js',
    './index.js'
  ]
};


/*******************************************************************************
* Helper functions
*******************************************************************************/
function clearConsole() {
    var lines = process.stdout.getWindowSize()[1];
    for(var i = 0; i < lines; i+=1) {
        console.log('\r\n');
    }
}

/*******************************************************************************
* Lint TASK
*******************************************************************************/

gulp.task('lint', function () {
  gulp.src(files.javascript)
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});


/*******************************************************************************
* GULP WATCH
*******************************************************************************/
gulp.task('watch', function() {
  gulp.watch(files.javascript, function() {
    clearConsole();
    gulp.start('lint');
  });
});


/*******************************************************************************
* Nodemon task
*******************************************************************************/

// gulp.task('develop', function () {
//   nodemon({ script: 'server.js', ext: 'html js', ignore: ['ignored.js'] })
//     .on('change', ['lint'])
//     .on('restart', function () {
//       console.log('restarted!')
//     })
// })


/*******************************************************************************
* GULP DEFAULT TASK
*******************************************************************************/
gulp.task('default', ['lint', 'watch']);
