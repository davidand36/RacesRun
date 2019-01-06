/*
    api/dbService.js

    Database service for the API

    See https://www.npmjs.com/package/knex
    and https://knexjs.org
*/

require( 'dotenv' ).config();
const _ = require( 'lodash' );
const knex = require( 'knex' );
const authService = require( './authService' );

const db = knex( {
    client: 'pg',
    connection: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: 'races',
        user: 'dbracesuser',
        password: process.env.DB_PASSWORD
    },
    asyncStackTraces: true //for development
} );

const userPublicNonkeyFields = [
    'fullName',
    'gender',
    'dateOfBirth'
];

const usersPublicFields = [
    'username',
    ...userPublicNonkeyFields
];

const usersAllNonkeyFields = [
    ...userPublicNonkeyFields,
    'email',
    'visibility'
];

const usersAllFields = [
    'username',
    ...usersAllNonkeyFields
];

const passwordsNonkeyFields = [
    'passHash'
];

async function getUsers( ) {
    return await db.select( makeSelectList( usersPublicFields ) )
        .from( 'users' )
        .orderBy( 'fullName' );
    //!!! Restrict visibility
}

async function getUser( username ) {
    const users = await db.select( makeSelectList( usersAllFields ) )
        .from( 'users' )
        .where( 'username', username);
    if ( users.length ) {
        return users[ 0 ];
    } else {
        return null;
    }
}

async function getPassHash( username ) {
    const passes = await db.select( makeSelectList( passwordsNonkeyFields ) )
        .from( 'passwords' )
        .where( 'username', username );
    if ( passes.length ) {
        return passes[ 0 ].passHash;
    } else {
        return null;
    }
}

async function createUser( data ) {
    return await db.transaction( async function( trx ) {
        const usernames = await trx.insert( convertDataForDb( data, usersAllFields ) )
            .returning( 'username' )
            .into( 'users' );
        await trx.insert( {
            username: data.username,
            pass_hash: await authService.hashPassword( data.password )
        } )
            .into( 'passwords' );
        return usernames[ 0 ];
    } )
    .catch( function( err ) {
        throw convertUsersDbError( err );
    } );
}

async function updateUser( username, data ) {
    //!!! if ( username !== loggedInUser ) return;
    let newData = convertDataForDb( data, usersAllNonkeyFields );
    if ( Object.keys( newData ).length === 0 ) {
        return Promise.resolve( );
    }
    await db( 'users' )
        .update( newData )
        .where( 'username', username )
    .catch ( function( err ) {
        throw convertUsersDbError( err );
    } );
}

async function updatePassword( username, password ) {
    await db( 'passwords' )
        .update( {
            pass_hash: await authService.hashPassword( password )
        } )
        .where( 'username', username )
    .catch ( function( err ) {
        throw convertUsersDbError( err );
    } );
}

async function changePassword( username, data) {
    //!!! if ( username !== loggedInUser ) return;
    if ( await authService.validateUser( username, data.currentPassword ) ) {
        await updatePassword( username, data.newPassword );
    } else {
        throw new Error( 'Unauthorized' );
    }
}

async function deleteUser( username ) {
    //!!! if ( username !== loggedInUser ) return;
    await db( 'users' )
        .del( )
        .where( 'username', username );
}

function convertUsersDbError( err ) {
    let message;
    // These are errors reported by PostgreSQL.
    switch ( err.code ) {
        case '23502': { //not_null_violation
            const fieldName = convertName( err.column );
            message = `Data Error: ${fieldName} is required`;
            break;
        }
        case '23505':   //unique_violation
        case '23514': { //check_violation
            switch ( err.constraint ) {
                case 'users_pkey': {
                    message = 'Data Error: This Username is already registered';
                    break;
                }
                case 'users_date_of_birth_check': {
                    message = 'Data Error: Invalid Date of Birth';
                    break;
                }
                case 'users_email_key': {
                    message = 'Data Error: This Email Address is already registered';
                    break;
                }
                default: {
                    console.log( 'err: ', err );
                    break;
                }
            }
            break;
        }
        case '22001': { //string_data_right_truncation
            message = 'Data Error: invalid data';
            break;
        }
        case '22P02': { //invalid_text_representation
            const re = /invalid input value for enum (\w+)/;
            const match = err.toString().match( re );
            if ( match ) {
                const fieldName = convertName( match[ 1 ] );
                message = `Data Error: Invalid value for ${fieldName}`;
            } else {
                message = 'Data Error: Invalid text value';
            }
            break;
        }
        default: {
            console.log( 'err: ', err );
            message = 'Database Error: ' + err.toString();
            break;
        }
    }

    return new Error( message );

    function convertName( dbFieldName ) {
        const specialNames = {
            'pass_hash': 'Password'
        };
        return specialNames[ dbFieldName ] || _.startCase( dbFieldName );
    }
}


async function getFriends( username ) {
    //!!! if ( username !== loggedInUser ) return;
    return await db.select( makeSelectList( usersPublicFields ) )
        .from( 'users' )
        .whereIn( 'username', function( ) {
            this.select( 'friend' )
                .from( 'friends' )
                .where( 'username', username );
        } );
}

async function addFriend( username, friend ) {
    //!!! if ( data.username !== loggedInUser ) return;
    const inserts = await db.insert( {
        username,
        friend
    } )
        .into( 'friends' )
        .returning( [ 'username', 'friend' ] )
    .catch ( function( err ) {
        throw convertFriendsDbError( err );
    } );
    return inserts[ 0 ];
}

async function deleteFriend( username, friend ) {
    //!!! if ( username !== loggedInUser ) return;
    await db( 'friends' )
        .del( )
        .where( { username, friend } );
}

function convertFriendsDbError( err ) {
    let message;
    // These are errors reported by PostgreSQL.
    switch ( err.code ) {
        case '23502': { //not_null_violation
            const fieldName = convertName( err.column );
            message = `Data Error: ${fieldName} is required`;
            break;
        }
        case '23503':   //foreign_key_violation
        case '23505': { //unique_violation
            switch ( err.constraint ) {
                case 'friends_pkey':
                case 'friends_username_friend_key': {
                    message = 'Data Error: This Friend is already listed';
                    break;
                }
                case 'friends_username_fkey': {
                    message = 'Data Error: Username does not refer to a known user';
                    break;
                }
                case 'friends_friend_fkey': {
                    message = 'Data Error: Friend does not refer to a known user';
                    break;
                }
                default: {
                    console.log( 'err: ', err );
                    break;
                }
            }
            break;
        }
        case '22001': { //string_data_right_truncation
            message = 'Data Error: invalid data';
            break;
        }
        default: {
            console.log( 'err: ', err );
            message = err.toString();
            break;
        }
    }

    return new Error( message );

    function convertName( dbFieldName ) {
        return _.startCase( dbFieldName );
    }
}


const racesUpdateFields = [
    'name',
    'url',
    'resultsUrl',
    'date',
    'city',
    'state',
    'country',
    'distance',
    'unit',
    'bib',
    'result',
    'chipTime',
    'gunTime',
    'overallPlace',
    'overallTotal',
    'genderPlace',
    'genderTotal',
    'divisionPlace',
    'divisionTotal',
    'divisionName',
    'notes'
];

const racesNonkeyFields = [
    'username',
    ...racesUpdateFields
]

const racesAllFields = [
    'id',
    ...racesNonkeyFields
];

async function getRace( id ) {
    const races = await db.select( makeSelectList( racesAllFields ) )
        .from( 'races' )
        .where( 'id', id );
    if ( races.length > 0 ) {
        return races[ 0 ];
    } else {
        return null;
    }
}

async function getUserRaces( username ) {
    //!!! Restrict visibility
    return await db.select( makeSelectList( racesAllFields ) )
        .from( 'races' )
        .where( 'username', username )
        .orderBy( 'date' );
}

async function createRace( data ) {
    //!!! if ( data.username !== loggedInUser ) return;
    const ids = await db.insert( convertDataForDb( data, racesNonkeyFields ) )
        .returning( 'id' )
        .into( 'races' )
    .catch( function ( err ) {
        throw convertRacesDbError( err );
    } );
    return ids[ 0 ];
}

async function updateRace( id, data ) {
    //!!! if ( username !== loggedInUser ) return;
    let newData = convertDataForDb( data, racesUpdateFields );
    if ( Object.keys( newData ).length === 0 ) {
        return Promise.resolve();
    }
    await db( 'races' )
        .update( newData )
        .where( 'id', id )
        .catch( function ( err ) {
            throw convertRacesDbError( err );
        } );
}

async function deleteRace( id ) {
    const usernames = await db.select( 'username' )
        .from( 'races' )
        .where( 'id', id );
    if ( usernames.length === 0 ) {
        return;
    }
    //!!! if ( usernames[ 0 ].username !== loggedInUser ) return;
    await db( 'races' )
        .del()
        .where( 'id', id );
}

function convertRacesDbError( err ) {
    let message;
    // These are errors reported by PostgreSQL.
    switch ( err.code ) {
        case '23502': { //not_null_violation
            const fieldName = convertName( err.column );
            message = `Data Error: ${fieldName} is required`;
            break;
        }
        case '23503':   //foreign_key_violation
        case '23514': { //check_violation
            switch ( err.constraint ) {
                case 'races_username_fkey': {
                    message = 'Data Error: Username does not refer to a known user';
                    break;
                }
                case 'races_date_check': {
                    message = 'Data Error: Invalid value for Date';
                    break;
                }
                case 'races_distance_check': {
                    message = 'Data Error: Invalid value for Distance';
                    break;
                }
                case 'races_chip_time_check': {
                    message = 'Data Error: Invalid value for Chip Time';
                    break;
                }
                case 'races_gun_time_check': {
                    message = 'Data Error: Invalid value for Gun Time';
                    break;
                }
                case 'races_overall_place_check': {
                    message = 'Data Error: Invalid value for Overall Place';
                    break;
                }
                case 'races_gender_place_check': {
                    message = 'Data Error: Invalid value for Gender Place';
                    break;
                }
                case 'races_division_place_check': {
                    message = 'Data Error: Invalid value for Division Place';
                    break;
                }
                default: {
                    console.log( 'err: ', err );
                    break;
                }
            }
            break;
        }
        case '22001': { //string_data_right_truncation
            message = 'Data Error: invalid data';
            break;
        }
        case '22P02': { //invalid_text_representation
            const re = /invalid input value for enum (\w+)/;
            const match = err.toString().match( re );
            if ( match ) {
                const fieldName = convertName( match[ 1 ] );
                message = `Data Error: Invalid value for ${fieldName}`;
            } else {
                message = 'Data Error: Invalid text value';
            }
            break;
        }
        default: {
            console.log( 'err: ', err );
            message = err.toString();
            break;
        }
    }

    return new Error( message );

    function convertName( dbFieldName ) {
        const specialNames = {
            'name': 'Race Name',
            'url': 'URL',
            'results_url': 'Results URL',
            'distance_unit': 'Unit'
        };
        return specialNames[ dbFieldName ] || _.startCase( dbFieldName );
    }
}


async function deleteAll( ) {
    await db( 'users' )
        .del( );
    await db( 'races' )
        .del( );
}

async function disconnect( ) {
    await db.destroy( );
}

function makeSelectList( fields ) {
    return fields.map( function( field ) {
        let item = _.snakeCase( field );
        if ( item.includes( '_' ) ) {
            item += ' as ' + _.camelCase( field );
        }
        return item;
    } );
}

function convertDataForDb( data, fields ) {
    let dbData = _.pick( data, fields );
    dbData = _.mapKeys( dbData, function( val, key ) {
        return _.snakeCase( key );
    } );
    return dbData;
}

module.exports = {
    getUsers,
    getUser,
    getPassHash,    //Not for Web API
    createUser,
    updateUser,
    updatePassword, //Not for Web API
    changePassword,
    deleteUser,
    getFriends,
    addFriend,
    deleteFriend,
    getUserRaces,
    getRace,
    createRace,
    updateRace,
    deleteRace,
    deleteAll,      //Not for Web API
    disconnect      //Not for Web API
}
