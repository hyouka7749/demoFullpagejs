const gulp = require('gulp');
const pug = require('gulp-pug');
const sass = require('gulp-sass')(require('sass')); 
const sourcemaps = require('gulp-sourcemaps');
const browserSync = require('browser-sync').create();
const plumber = require('gulp-plumber'); 


const paths = {
  pug: {
    src: 'src/pug/pages/**/*.pug', 
    watch: 'src/pug/**/*.pug',    
    dest: 'dist/'
  },
  scss: {
    src: 'src/scss/main.scss',    
    watch: 'src/scss/**/*.scss',  
    dest: 'dist/css/'
  },
  js: {
    src: 'src/js/**/*.js',
    watch: 'src/js/**/*.js',
    dest: 'dist/js/'
  },
  assets: {
    src: 'src/assets/**/*',
    watch: 'src/assets/**/*',
    dest: 'dist/' 
  },
  clean: 'dist/'
};

async function clean() { 
    const { deleteAsync } = await import('del'); 
    return deleteAsync([paths.clean]); 
  }


function compilePug() {
  return gulp.src(paths.pug.src)
    .pipe(plumber())
    .pipe(pug({ pretty: true })) 
    .pipe(gulp.dest(paths.pug.dest))
    .pipe(browserSync.stream()); 
}


async function compileScss() { 
    const autoprefixer = (await import('gulp-autoprefixer')).default; 

    return gulp.src(paths.scss.src)
      .pipe(plumber())
      .pipe(sourcemaps.init())
      .pipe(sass({ outputStyle: 'expanded' }).on('error', sass.logError))
      .pipe(autoprefixer({ cascade: false })) 
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest(paths.scss.dest))
      .pipe(browserSync.stream());
  }

function copyJs() {
  return gulp.src(paths.js.src)
    .pipe(plumber())
    .pipe(gulp.dest(paths.js.dest))
    .pipe(browserSync.stream());
}

function copyAssets() {
  return gulp.src(paths.assets.src)
    .pipe(gulp.dest(paths.assets.dest))
    .pipe(browserSync.stream());
}


function serve() {
  browserSync.init({
    server: {
      baseDir: './dist/' 
    },
    port: 3000,
    notify: false 
  });

  gulp.watch(paths.pug.watch, compilePug);
  gulp.watch(paths.scss.watch, compileScss);
  gulp.watch(paths.js.watch, copyJs);
  gulp.watch(paths.assets.watch, copyAssets);
}

const build = gulp.series(clean, gulp.parallel(compilePug, compileScss, copyJs, copyAssets));

const dev = gulp.series(build, serve);


exports.clean = clean;
exports.pug = compilePug;
exports.scss = compileScss;
exports.js = copyJs;
exports.assets = copyAssets;
exports.build = build;
exports.serve = dev; 
exports.default = dev; 