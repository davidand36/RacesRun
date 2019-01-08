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
router.get( '/users/:username', getUser );
router.post( '/users/', createUser );
router.put( '/users/:username', updateUser );
router.put( '/users/:username/password', changePassword );
router.delete( '/users/:username', deleteUser );
router.get( '/users/:username/friends', getFriends );
router.post( '/users/:username/friends/:friend', addFriend );
router.delete( '/users/:username/friends/:friend', deleteFriend );

router.get( '/users/:username/races/', getUserRaces );
router.get( '/races/:id', getRace );
router.post( '/races/', createRace );
router.put( '/races/:id', updateRace );
router.delete( '/races/:id', deleteRace );

async function getUsers( ctx ) {
    try {
        const users = await dbService.getUsers();
        ctx.response.body = users;
    } catch( err ) {
        console.error( err );
        ctx.response.status = 500;
    }
}

async function getUser( ctx ) {
    try {
        const user = await dbService.getUser( ctx.params.username );
        if ( user ) {
            ctx.response.body = user;
        } else {
            ctx.response.status = 404;
        }
    } catch( err ) {
        console.error( err );
        ctx.response.status = 500;
    }
}

async function createUser( ctx ) {
    try {
        const username = await dbService.createUser( ctx.request.body );
        ctx.response.body = username;
    } catch ( err ) {
        //!!! Handle expected errors
        console.error( err );
        ctx.response.status = 500;
    }
}

async function updateUser( ctx ) {
    try {
        await dbService.updateUser( ctx.params.username, ctx.request.body );
        ctx.response.status = 200;
    } catch ( err ) {
        //!!! Handle expected errors
        console.error( err );
        ctx.response.status = 500;
    }
}

async function changePassword( ctx ) {
    try {
        await dbService.changePassword( ctx.params.username, ctx.request.body );
        ctx.response.status = 200;
    } catch ( err ) {
        //!!! Handle expected errors
        console.error( err );
        ctx.response.status = 500;
    }
}

async function deleteUser( ctx ) {
    try {
        await dbService.deleteUser( ctx.params.username );
        ctx.response.status = 200;
    } catch ( err ) {
        console.error( err );
        ctx.response.status = 500;
    }
}

async function getFriends( ctx ) {
    try {
        const friends = await dbService.getFriends( ctx.params.username );
        ctx.response.body = friends;
    } catch ( err ) {
        console.error( err );
        ctx.response.status = 500;
    }
}

async function addFriend( ctx ) {
    try {
        const rslt = await dbService.addFriend( ctx.params.username, ctx.params.friend );
        ctx.response.body = rslt;
    } catch ( err ) {
        //!!! Handle expected errors
        console.error( err );
        ctx.response.status = 500;
    }
}

async function deleteFriend( ctx ) {
    try {
        await dbService.deleteFriend( ctx.params.username, ctx.params.friend );
        ctx.response.status = 200;
    } catch ( err ) {
        console.error( err );
        ctx.response.status = 500;
    }
}

async function getUserRaces( ctx ) {
    try {
        const races = await dbService.getUserRaces( ctx.params.username );
        ctx.response.body = races;
    } catch ( err ) {
        console.error( err );
        ctx.response.status = 500;
    }
}

async function getRace( ctx ) {
    try {
        const race = await dbService.getRace( ctx.params.id );
        if ( race ) {
            ctx.response.body = race;
        } else {
            ctx.response.status = 404;
        }
    } catch ( err ) {
        console.error( err );
        ctx.response.status = 500;
    }
}

async function createRace( ctx ) {
    try {
        const id = await dbService.createRace( ctx.request.body );
        ctx.response.body = id;
    } catch ( err ) {
        //!!! Handle expected errors
        console.error( err );
        ctx.response.status = 500;
    }
}

async function updateRace( ctx ) {
    try {
        await dbService.updateRace( ctx.params.id, ctx.request.body );
        ctx.response.status = 200;
    } catch ( err ) {
        //!!! Handle expected errors
        console.error( err );
        ctx.response.status = 500;
    }
}

async function deleteRace( ctx ) {
    try {
        await dbService.deleteRace( ctx.params.id );
        ctx.response.status = 200;
    } catch ( err ) {
        console.error( err );
        ctx.response.status = 500;
    }
}

module.exports = router;