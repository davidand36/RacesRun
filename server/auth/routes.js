/*
    auth/routes.js

    Routes for authentication

    See https://www.npmjs.com/package/koa-router
    and https://www.npmjs.com/package/koa-body
*/

const Router = require( 'koa-router' );
const koaBody = require( 'koa-body' );
const passport = require( 'koa-passport' );

const router = new Router( );

router.post( '/login', koaBody(), logIn );
router.post( '/logout', logOut );
router.get( '/status', getStatus );

function logIn( ctx ) {
    return passport.authenticate( 'local', function( err, username ) {
        if ( err ) {
            console.error( err );
            ctx.response.status = 500;
        } else if ( ! username ) {
            ctx.response.status = 401;
        } else {
            ctx.logIn( username, function( err ) {
                if ( err ) {
                    console.error( err );
                    ctx.response.status = 500;
                } else {
                    ctx.response.body = username;
                }
            } );
        }
    } )( ctx );
}

function logOut( ctx ) {
    ctx.logout( );
    ctx.response.body = 'OK';
}

async function getStatus( ctx ) {
    let response = {
        authenticated: ctx.isAuthenticated(),
        username: ctx.state.user
    };
    ctx.response.body = response;
}

module.exports = router;
