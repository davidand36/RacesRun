/*
    auth/authService.js

    Authentication/authorization service
*/

const crypto = require( 'crypto' );
const passport = require( 'koa-passport' );
const LocalStrategy = require( 'passport-local' ).Strategy;

function hashPassword( password ) {
    return new Promise( function( resolve, reject ) {
        if ( ! password ) {
            resolve( null );
            return;
        }
        const saltSize = 16;
        const keyLen = 64;
        crypto.randomBytes( saltSize, function( err, salt ) {
            if ( err ) {
                reject( err );
            } else {
                crypto.scrypt( password, salt, keyLen, function( err, key ) {
                    if ( err ) {
                        reject( err );
                    } else {
                        resolve( {
                            algorithm: 'scrypt',
                            salt: salt.toString('hex'),
                            keyLen: keyLen,
                            key: key.toString('hex')
                        } );
                    }
                } );
            }
        } );
    } );
}

function validatePassword( password, passHash ) {
    return new Promise( function( resolve, reject ) {
        if ( password && passHash ) {
            if ( passHash.algorithm === 'scrypt' ) {
                const salt = Buffer.from( passHash.salt, 'hex' );
                crypto.scrypt( password, salt, passHash.keyLen, function ( err, key ) {
                    if ( err ) {
                        reject( err );
                    } else {
                        resolve( key.toString( 'hex' ) === passHash.key );
                    }
                } );
            } else {
                reject( new Error( 'Unexpected algorithm: ', passHash.algorithm ) );
            }
        } else {
            resolve( false );
        }
    } );
}

function validateUser( username, password ) {
    return new Promise( async function( resolve, reject ) {
        const dbService = require( '../api/dbService' );
        const passHash = await dbService.getPassHash( username );
        return validatePassword( password, passHash )
            .then( resolve, reject );
    } );
}

passport.use( new LocalStrategy( function( username, password, done) {
    validateUser( username, password )
    .then( function( valid ) {
        return done( null, valid ? username : false );
    } )
    .catch( function( err ) {
        console.error( 'validateUser error: ', err );
        return done( err );
    } );
} ) );

passport.serializeUser( function( username, done ) {
    done( null, username );
} );

passport.deserializeUser( function( username, done ) {
    done( null, username );
} );

module.exports = {
    hashPassword,
    validatePassword,
    validateUser
};
