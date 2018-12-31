/*
    gulpfile.js

    See https://gulpjs.com/
    and https://www.npmjs.com/package/del
    and https://www.npmjs.com/package/gulp-eslint
    and https://eslint.org/
    and https://www.npmjs.com/package/gulp-htmlhint
    and https://github.com/htmlhint/HTMLHint
    and https://www.npmjs.com/package/gulp-sass-lint
    and https://github.com/sasstools/sass-lint
    and https://www.npmjs.com/package/gulp-replace
    and https://www.npmjs.com/package/gulp-sass
    and https://www.npmjs.com/package/node-sass
*/

const { series, parallel, src, dest } = require( 'gulp' );
const pkg = require( './package.json' );
const del = require( 'del' );
const htmlHint = require( 'gulp-htmlhint' );
const esLint = require( 'gulp-eslint' );
const sassLint = require( 'gulp-sass-lint' );
const replace = require( 'gulp-replace' );
const sass = require( 'gulp-sass' );

function cleanPublic( ) {
    return del( [ 'public/' ] );
}

function lintSystemJs( ) {
    return src( '*.js' )
        .pipe( esLint() )
        .pipe( esLint.format() )
        .pipe( esLint.failAfterError() );
}

function lintServerJs( ) {
    return src( 'server/**/*.js' )
        .pipe( esLint() )
        .pipe( esLint.format() )
        .pipe( esLint.failAfterError() );
}

function lintHtml( ) {
    return src( 'client/**/*.html' )
        .pipe( htmlHint() )
        .pipe( htmlHint.failAfterError() );
}

function lintSass( ) {
    return src( 'client/**/*.s+(a|c)ss' )
        .pipe( sassLint() )
        .pipe( sassLint.format() )
        .pipe( sassLint.failOnError() );
}

function lintClientJs( ) {
    return src( 'client/**/*.js' )
        .pipe( esLint() )
        .pipe( esLint.format() )
        .pipe( esLint.failAfterError() );
}

const lint = parallel( lintSystemJs, lintServerJs, lintHtml, lintSass, lintClientJs );

function copyHtml( ) {
    return src( 'client/**/*.html' )
        .pipe( replace( '@@version@@', pkg.version ) )
        .pipe( dest( 'public/' ) );
}

function copyScss( ) {
    return src( 'client/**/*.scss' )
        .pipe( dest( 'public/scss' ) );
}

function runSass( ) {
    return src( 'public/scss/**/*.scss', { sourcemaps: true } )
        .pipe( sass().on( 'error', sass.logError ) )
        .pipe( dest( 'public/', { sourcemaps: 'maps/' } ) );
}

const processScss = series( copyScss, runSass );

function copyMedia( ) {
    return src( [ 'client/**/*.svg', 'client/**/*.png', 'client/**/*.jpg', 'client/**/*.gif', 'client/**/*.ogg', 'client/**/*.opus', 'client/**/*.mp3', 'client/**/*.flac', 'client/**/*.weba', 'client/**/*.webm', 'client/**/*.mp4', 'client/**/*.ico' ],
        {
            buffer: false,
            resolveSymlinks: false
        } )
        .pipe( dest( 'public/' ) );
}

const processMedia = parallel( copyMedia );

function copyJs( ) {
    return src( 'client/**/*.js' )
        .pipe( dest( 'public/' ) );
}

const buildClient = parallel( copyHtml, processScss, processMedia, copyJs );

exports.clean = cleanPublic;
exports.lint = lint;
exports.dev = series( lint, cleanPublic, buildClient );
exports.default = exports.dev;
