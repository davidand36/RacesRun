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
    and https://www.npmjs.com/package/koa-static
*/

require( 'dotenv' ).config( );
const Koa = require( 'koa' );
const helmet = require( 'koa-helmet' );
const favicon = require( 'koa-favicon' );
const logger = require( 'koa-logger' );
const compress = require( 'koa-compress' );
const Router = require( 'koa-router' );
const koaStatic = require( 'koa-static' );
const apiRoutes = require( './api/routes' );

const koa = new Koa( );
const router = new Router( );

koa.use( helmet( ) );
koa.use( favicon( './public/favicon.ico' ) );
koa.use( logger( ) );
koa.use( compress( ) );
router.use( '/api/v1', apiRoutes.routes(), apiRoutes.allowedMethods() );
koa.use( router.routes() ).use( router.allowedMethods() );
koa.use( koaStatic( './public') );

const port = process.env.WEB_PORT || process.env.PORT || 80;
koa.listen( port );
console.log( 'Listening on port ', port );
