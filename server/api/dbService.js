/*
    api/dbService.js

    Database service for the API

    See https://www.npmjs.com/package/knex
    and https://knexjs.org
*/

require( 'dotenv' ).config();
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

const userPublicFields = [ 
    'username',
    'full_name as fullName',
    'gender',
    'date_of_birth as dateOfBirth'
];

async function getUsers( ) {
    return await db.select( userPublicFields )
        .from( 'users' );
    //!!! Restrict visibility
}

async function getUser( username ) {
    let fields = userPublicFields;
    //!!! if ( username !== loggedInUser ) 
    fields.push( 'email' );
    const users = await db.select( fields )
        .from( 'users' )
        .where( 'username', username);
    if ( users.length ) {
        return users[ 0 ];
    } else {
        return null;
    }
}

async function getPassHash( username ) {
    const passes = await db.select( 'pass_hash as passHash' )
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
        const usernames = await trx.insert( {
            username: data.username,
            full_name: data.fullName,
            gender: data.gender,
            date_of_birth: data.dateOfBirth,
            email: data.email,
            visibility: data.visibility
        } )
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
        throw convertDbError( err );
    } );
}

async function updateUser( username, data ) {
    //!!! if ( username !== loggedInUser ) return;
    let newData = {};
    if ( data.fullName ) {
        newData.full_name = data.fullName;
    }
    if ( data.gender ) {
        newData.gender = data.gender;
    }
    if ( data.dateOfBirth ) {
        newData.date_of_birth = data.dateOfBirth
    }
    if ( data.email ) {
        newData.email = data.email;
    }
    if ( data.visibility ) {
        newData.visibility = data.visibility;
    }
    await db( 'users' )
        .update( newData )
        .where( 'username', username );
}

async function updatePassword( username, data ) {
    //!!! if ( username !== loggedInUser ) return;
    if ( await authService.validateUser( username, data.currentPassword ) ) {
        await db( 'passwords' )
            .update( {
                pass_hash: await authService.hashPassword( data.newPassword )
            } )
            .where( 'username', username );
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

async function getFriends( username ) {
    //!!! if ( username !== loggedInUser ) return;
    return await db.select( userPublicFields )
        .from( 'users' )
        .whereIn( 'username', function( ) {
            this.select( 'friend' )
                .from( 'friends' )
                .where( 'username', username );
        } );
}

async function addFriend( data ) {
    //!!! if ( data.username !== loggedInUser ) return;
    return await db.insert( {
        username: data.username,
        friend: data.friend
    } )
        .into( 'friends' )
        .returning( 'id' );
}

async function deleteFriend( id ) {
    const usernames = await db.select( 'username' )
        .from( 'friends' )
        .where( 'id', id );
    if ( usernames.length === 0 ) {
        return;
    }
    //!!! if ( usernames[ 0 ].username !== loggedInUser ) return;
    await db( 'friends' )
        .del( )
        .where( 'id', id );
}

const racePublicFields = [
    'id',
    'name',
    'url',
    'results_url as resultsUrl',
    'date',
    'city',
    'state',
    'country',
    'distance',
    'unit',
    'bib',
    'result',
    'chip_time as chipTime',
    'gun_time as gunTime',
    'overall_place as overallPlace',
    'overall_total as overallTotal',
    'gender_place as genderPlace',
    'gender_total as genderTotal',
    'division_place as divisionPlace',
    'division_total as divisionTotal',
    'division_name as divisionName',
    'notes'
];

async function getUserRaces( username ) {
    //!!! Restrict visibility
    return await db.select( racePublicFields )
        .from( 'races' )
        .where( 'username', username );    
}

async function createRace( data ) {
    //!!! if ( data.username !== loggedInUser ) return;
    return await db.insert( {
        username: data.username,
        name: data.name,
        url: data.url,
        results_url: data.resultsUrl,
        date: data.date,
        city: data.city,
        state: data.state,
        country: data.country,
        distance: data.distance,
        unit: data.unit,
        bib: data.bib,
        result: data.result,
        chip_time: data.chipTime,
        gun_time: data.gunTime,
        overall_place: data.overallPlace,
        overall_total: data.overallTotal,
        gender_place: data.genderPlace,
        gender_total: data.genderTotal,
        division_place: data.divisionPlace,
        division_total: data.divisionTotal,
        division_name: data.divisionName,
        notes: data.notes
    } )
        .returning( 'id' )
        .into( 'races' );
}

async function updateRace( id, data ) {
    //!!!
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

function convertDbError( err ) {
    let message;
    // These are errors reported by PostgreSQL.
    switch ( err.code ) {
        case '23502': //not_null_violation
            message = 'Data Error: required field missing';
            break;
        case '23505': //unique_violation
            message = 'Data Error: duplicate value';
            break;
        case '22001': //string_data_right_truncation
        case '22008': //datetime_field_overflow
        case '22026': //string_data_length_mismatch
        case '23001': //restrict_violation
        case '23503': //foreign_key_violation
        case '23514': //check_violation
        case '23P01': //exclusion_violation
            message = 'Data Error: invalid data';
            break;
        default:
            return err;
    }
    if ( err.column ) {
        message += ': ' + err.column;
    }
    return new Error( message );
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

module.exports = {
    getUsers,
    getUser,
    getPassHash,
    createUser,
    updateUser,
    updatePassword,
    deleteUser,
    getFriends,
    addFriend,
    deleteFriend,
    getUserRaces,
    createRace,
    updateRace,
    deleteRace,
    deleteAll,
    disconnect
}
