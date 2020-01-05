/*
    api/dbService.js

    Database service for the API

    See https://www.npmjs.com/package/knex
    and https://knexjs.org
*/

require( 'dotenv' ).config();
const _ = require( 'lodash' );
const knex = require( 'knex' );
const authService = require( '../auth/authService' );

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

const usersPublicNonkeyFields = [
    'fullName',
    'gender',
    'dateOfBirth'
];

const usersPublicFields = [
    'username',
    ...usersPublicNonkeyFields
];

const usersAllNonkeyFields = [
    ...usersPublicNonkeyFields,
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

async function isUserVisible( username, requestingUser ) {
    if ( username === requestingUser ) {
        return true;
    }
    const visibilities = await db.select( 'visibility' )
        .from( 'users' )
        .where( 'username', username );
    const visibility = visibilities[ 0 ].visibility;
    if ( requestingUser ) {
        if ( visibility === 'public' || visibility === 'users' ) {
            return true;
        } else if ( visibility === 'friends' ) {
            const friends = await db.select( 'friend' )
                .from( 'friends' )
                .where( { username: username, friend: requestingUser } );
            return (friends.length > 0);
        }
        return false;
    } else {
        return (visibility === 'public');
    }
}

async function getUsers( ) {
    return await db.select( makeSelectList( usersPublicFields ) )
        .from( 'users' )
        .orderBy( 'fullName' );
}

async function getVisibleUsers( requestingUser ) {
    if ( requestingUser ) {
        return await db.select( makeSelectList( usersPublicFields ) )
            .from( 'users' )
            .orderBy( 'fullName' )
            .where( 'username', requestingUser )
            .orWhere( 'visibility', 'public' )
            .orWhere( 'visibility', 'users' )
            .orWhere( function( ) {
                this.whereExists( db.select( '*' )
                        .from( 'friends' )
                        .whereRaw( 'username = users.username and friend = ?', [ requestingUser ] ) )
                    .andWhere( 'visibility', 'friends' );
            } );
    } else {
        return await db.select( makeSelectList( usersPublicFields ) )
            .from( 'users' )
            .orderBy( 'fullName' )
            .where( 'visibility', 'public' );
    }
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
    if ( await authService.validateUser( username, data.currentPassword ) ) {
        await updatePassword( username, data.newPassword );
    } else {
        throw new Error( 'Unauthorized' );
    }
}

async function deleteUser( username ) {
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
    return await db.select( makeSelectList( usersPublicFields ) )
        .from( 'users' )
        .whereIn( 'username', function( ) {
            this.select( 'friend' )
                .from( 'friends' )
                .where( 'username', username );
        } );
}

async function addFriend( username, friend ) {
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
    'bib',
    'scoring',
    'result',
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
];

const racesAllFields = [
    'id',
    ...racesNonkeyFields
];

const legsUpdateFields = [
    'distance',
    'unit',
    'sport',
    'terrain',
    'chipTime',
    'gunTime'
];

const legsNonkeyFields = [
    'race',
    ...legsUpdateFields
];

const legsAllFields = [
    'id',
    ...legsNonkeyFields
];

async function getRace( id ) {
    const races = await db.select( makeSelectList( racesAllFields ) )
        .from( 'races' )
        .where( 'id', id );
    if ( races.length > 0 ) {
        let race = races[ 0 ];
        const legs = await db.select( makeSelectList( legsAllFields ) )
            .from( 'legs' )
            .where( 'race', id );
        race.legs = legs;
        return race;
    } else {
        return null;
    }
}

async function getUserRaces( username ) {
    let races = await db.select( makeSelectList( racesAllFields ) )
        .from( 'races' )
        .where( 'username', username )
        .orderBy( 'date' );
    for ( let i = 0, numRaces = races.length; i < numRaces; ++i ) {
        let race = races[ i ];
        let legs = await db.select( makeSelectList( legsAllFields ) )
            .from( 'legs' )
            .where( 'race', race.id );
        race.legs = legs;
    }
    return races;
}

async function createRace( data ) {
    const ids = await db.insert( convertDataForDb( data, racesNonkeyFields ) )
        .returning( 'id' )
        .into( 'races' )
    .catch( function ( err ) {
        throw convertRacesDbError( err );
    } );
    if ( ! data.legs || data.legs.length === 0 ) {
        throw new Error( 'Data Error: At least one leg is required' );
    }
    const id = ids[ 0 ];
    for ( let i = 0, numLegs = data.legs.length; i < numLegs; ++i ) {
        let leg = data.legs[ i ];
        leg.race = id;
        await db.insert( convertDataForDb( leg, legsNonkeyFields ) )
            .into( 'legs' )
            .catch( function( err ) {
                throw convertLegsDbError( err );
            } );
    }
    return id;
}

async function updateRace( id, data ) {
    let newData = convertDataForDb( data, racesUpdateFields );
    if ( Object.keys( newData ).length > 0 ) {
        await db( 'races' )
            .update( newData )
            .where( 'id', id )
            .catch( function( err ) {
                throw convertRacesDbError( err );
            } );
    }
    if ( data.legs && data.legs.length > 0 ) {
        await db( 'legs' )
            .del()
            .where( 'race', id );
        for ( let i = 0, numLegs = data.legs.length; i < numLegs; ++i ) {
            let leg = data.legs[ i ];
            leg.race = id;
            await db.insert( convertDataForDb( leg, legsNonkeyFields ) )
                .into( 'legs' )
                .catch( function( err ) {
                    throw convertLegsDbError( err );
                } );
        }
    }
    return Promise.resolve();
}

async function deleteRace( id ) {
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
            'result_type': 'Result'
        };
        return specialNames[ dbFieldName ] || _.startCase( dbFieldName );
    }
}

function convertLegsDbError( err ) {
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
                case 'legs_distance_check': {
                    message = 'Data Error: Invalid value for Distance';
                    break;
                }
                case 'legs_chip_time_check': {
                    message = 'Data Error: Invalid value for Chip Time';
                    break;
                }
                case 'legs_gun_time_check': {
                    message = 'Data Error: Invalid value for Gun Time';
                    break;
                }
                default: {
                    console.log( 'err: ', err );
                    break;
                }
            }
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

async function reconnect( ) {
    db.initialize( );
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
    dbData = _.omitBy( dbData, function( val ) {
        return (val === undefined)
    } );
    dbData = _.mapKeys( dbData, function( val, key ) {
        return _.snakeCase( key );
    } );
    dbData = _.mapValues( dbData, function( val ) {
        //Convert '', NaN to null
        return (val || val === 0 || val === false)  ?  val  :  null;
    } );
    return dbData;
}


module.exports = {
    isUserVisible,
    getUsers,       //Not for Web API
    getVisibleUsers,
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
    disconnect,     //Not for Web API
    reconnect       //Not for Web API
};
