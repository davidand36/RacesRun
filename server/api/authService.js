/*
    api/authService.js

    Authentication/authorization service
*/

const crypto = require( 'crypto' );

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
        if ( passHash ) {
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
                reject( new Error( 'Unexpected algorithm: ', algorithm ) );
            }
        } else {
            resolve( false );
        }
    } );
}

function validateUser( username, password ) {
    return new Promise( async function( resolve, reject ) {
        const dbService = require( './dbService' );
        const passHash = await dbService.getPassHash( username );
        return validatePassword( password, passHash )
            .then( resolve, reject );
    } );
}

module.exports = {
    hashPassword,
    validatePassword,
    validateUser
}