/*
    web.js

    Entry point for Web server

    See https://www.npmjs.com/package/dotenv
    and https://koajs.com/
    and https://www.npmjs.com/package/koa-helmet
    and https://www.npmjs.com/package/koa-favicon
    and https://www.npmjs.com/package/koa-logger
    and https://www.npmjs.com/package/koa-compress
    and https://www.npmjs.com/package/koa-router
    and https://www.npmjs.com/package/koa-connect-history-api-fallback
    and https://www.npmjs.com/package/connect-history-api-fallback
    and https://www.npmjs.com/package/koa-static
*/

require( 'dotenv' ).config( );
const Koa = require( 'koa' );
const helmet = require( 'koa-helmet' );
const favicon = require( 'koa-favicon' );
const logger = require( 'koa-logger' );
const session = require( 'koa-session' );
const passport = require( 'koa-passport' );
const compress = require( 'koa-compress' );
const Router = require( 'koa-router' );
const singlePage = require( 'koa-connect-history-api-fallback' );
const koaStatic = require( 'koa-static' );
require( './auth/authService' );
const authRoutes = require( './auth/routes' );
const apiRoutes = require( './api/routes' );

const koa = new Koa( );
const router = new Router( );

koa.keys = [ process.env.SIGNED_COOKIE_KEY ];

koa.use( helmet( ) );
koa.use( favicon( './public/favicon.ico' ) );
koa.use( logger( ) );
koa.use( session( {}, koa ) );
koa.use( passport.initialize() );
koa.use( passport.session() );
koa.use( compress( ) );
router.use( '/auth', authRoutes.routes(), authRoutes.allowedMethods() );
router.use( '/api/v1', apiRoutes.routes(), apiRoutes.allowedMethods() );
koa.use( router.routes() ).use( router.allowedMethods() );
koa.use( singlePage( {
    index: '/index.html',
    rewrites: [
        {
            from: /^\/calculator(\/(index.html)?)?$/,
            to: '/calculator/index.html'
        }
    ],
    verbose: false
} ) );
koa.use( koaStatic( './public') );

const port = process.env.WEB_PORT || process.env.PORT || 80;
koa.listen( port );
console.log( 'Listening on port ', port );
