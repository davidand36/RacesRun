/*
    api/routes.js

    Routes for the API

    See https://www.npmjs.com/package/koa-router
    and https://www.npmjs.com/package/koa-body
*/

const Router = require( 'koa-router' );
const koaBody = require( 'koa-body' );
const dbService = require( './dbService' );

const router = new Router( );

router.get( '/users/', getUsers );
router.get( '/users/:username', authUser, getUser );
router.post( '/users/', koaBody(), createUser );
router.put( '/users/:username', koaBody(), authUser, updateUser );
router.put( '/users/:username/password', koaBody(), authUser, changePassword );
router.delete( '/users/:username', authUser, deleteUser );
router.get( '/users/:username/friends', authUser, getFriends );
router.post( '/users/:username/friends/:friend', authUser, addFriend );
router.delete( '/users/:username/friends/:friend', authUser, deleteFriend );

router.get( '/users/:username/races/', getUserRaces );
router.get( '/races/:id', getRace );
router.post( '/races/', koaBody(), createRace );
router.put( '/races/:id', koaBody(), updateRace );
router.delete( '/races/:id', deleteRace );

async function getUsers( ctx ) {
    await dbService.getVisibleUsers( ctx.state.user )
    .then( users => {
        ctx.response.body = users;
    } )
    .catch( err => {
        console.error( err );
        ctx.response.status = 500;
    } );
}

async function authUser( ctx, next ) {
    if ( ctx.params.username === ctx.state.user ) {
        await next( );
    } else {
        ctx.response.status = 403;
    }
}

async function getUser( ctx ) {
    await dbService.getUser( ctx.params.username )
    .then( user => {
        if ( user ) {
            ctx.response.body = user;
        } else {
            ctx.response.status = 404;
        }
    } )
    .catch( err => {
        console.error( err );
        ctx.response.status = 500;
    } );
}

async function createUser( ctx ) {
    await dbService.createUser( ctx.request.body )
    .then( username => {
        ctx.response.body = username;
        ctx.response.status = 201;
    } )
    .catch( err => {
        if ( err.message.startsWith( 'Data Error' ) ) {
            ctx.response.body = { error: err.message };
            ctx.response.status = 400;
        } else {
            console.error( err );
            ctx.response.status = 500;
        }
    } );
}

async function updateUser( ctx ) {
    await dbService.updateUser( ctx.params.username, ctx.request.body )
    .then( () => {
        ctx.response.status = 200;
    } )
    .catch( err => {
        if ( err.message.startsWith( 'Data Error' ) ) {
            ctx.response.body = { error: err.message };
            ctx.response.status = 400;
        } else {
            console.error( err );
            ctx.response.status = 500;
        }
    } );
}

async function changePassword( ctx ) {
    await dbService.changePassword( ctx.params.username, ctx.request.body )
    .then( () => {
        ctx.response.status = 200;
    } )
    .catch( err => {
        if ( err.message.startsWith( 'Unauthorized' ) ) {
            ctx.response.status = 401;
        } else if ( err.message.startsWith( 'Data Error' ) ) {
            ctx.response.body = { error: err.message };
            ctx.response.status = 400;
        } else {
            console.error( err );
            ctx.response.status = 500;
        }
    } );
}

async function deleteUser( ctx ) {
    await dbService.deleteUser( ctx.params.username )
    .then( () => {
        ctx.response.status = 200;
    } )
    .catch( err => {
        console.error( err );
        ctx.response.status = 500;
    } );
}

async function getFriends( ctx ) {
    await dbService.getFriends( ctx.params.username )
    .then( friends => {
        ctx.response.body = friends;
    } )
    .catch( err => {
        console.error( err );
        ctx.response.status = 500;
    } );
}

async function addFriend( ctx ) {
    await dbService.addFriend( ctx.params.username, ctx.params.friend )
    .then( rslt => {
        ctx.response.body = rslt;
        ctx.response.status = 201;
    } )
    .catch( err => {
        if ( err.message.startsWith( 'Data Error' ) ) {
            ctx.response.body = { error: err.message };
            ctx.response.status = 400;
        } else {
            console.error( err );
            ctx.response.status = 500;
        }
    } );
}

async function deleteFriend( ctx ) {
    await dbService.deleteFriend( ctx.params.username, ctx.params.friend )
    .then( () => {
        ctx.response.status = 200;
    } )
    .catch( err => {
        console.error( err );
        ctx.response.status = 500;
    } );
}

async function getUserRaces( ctx ) {
    if ( ! await dbService.isUserVisible( ctx.params.username, ctx.state.user ) ) {
        ctx.response.status = 403;
        return;
    }
    await dbService.getUserRaces( ctx.params.username )
    .then( races => {
        ctx.response.body = races;
    } )
    .catch( err => {
        console.error( err );
        ctx.response.status = 500;
    } );
}

async function getRace( ctx ) {
    await dbService.getRace( ctx.params.id )
    .then( race => {
        if ( race ) {
            if ( race.username === ctx.state.user ) {
                ctx.response.body = race;
            } else {
                ctx.response.status = 403;
            }
        } else {
            ctx.response.status = 404;
        }
    } )
    .catch( err => {
        console.error( err );
        ctx.response.status = 500;
    } );
}

async function createRace( ctx ) {
    if ( ctx.request.body.username !== ctx.state.user ) {
        ctx.response.status = 403;
        return;
    }
    await dbService.createRace( ctx.request.body )
    .then( id => {
        ctx.response.body = id;
        ctx.response.status = 201;
    } )
    .catch( err => {
        if ( err.message.startsWith( 'Data Error' ) ) {
            ctx.response.body = { error: err.message };
            ctx.response.status = 400;
        } else {
            console.error( err );
            ctx.response.status = 500;
        }
    } );
}

async function updateRace( ctx ) {
    const race = await dbService.getRace( ctx.params.id );
    if ( race && (race.username !== ctx.state.user) ) {
        ctx.response.status = 403;
        return;
    }
    await dbService.updateRace( ctx.params.id, ctx.request.body )
    .then( () => {
        ctx.response.status = 200;
    } )
    .catch( err => {
        if ( err.message.startsWith( 'Data Error' ) ) {
            ctx.response.body = { error: err.message };
            ctx.response.status = 400;
        } else {
            console.error( err );
            ctx.response.status = 500;
        }
    } );
}

async function deleteRace( ctx ) {
    const race = await dbService.getRace( ctx.params.id );
    if ( race && (race.username !== ctx.state.user) ) {
        ctx.response.status = 403;
        return;
    }
    await dbService.deleteRace( ctx.params.id )
    .then( () => {
        ctx.response.status = 200;
    } )
    .catch( err => {
        console.error( err );
        ctx.response.status = 500;
    } );
}

module.exports = router;
