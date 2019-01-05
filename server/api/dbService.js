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
        .from( 'users' )
        .orderBy( 'fullName' );
    //!!! Restrict visibility
}

async function getUser( username ) {
    let fields = userPublicFields.slice( 0 );
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
        throw convertUsersDbError( err );
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
        const fieldNameMap = {
            'username': 'Username',
            'full_name': 'Full Name',
            'gender': 'Gender',
            'date_of_birth': 'Date of Birth',
            'email': 'Email',
            'visibility': 'Visibility',
            'pass_hash': 'Password'
        };
        return fieldNameMap[ dbFieldName ];
    }
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
        const fieldNameMap = {
            'username': 'Username',
            'friend': 'Friend'
        };
        return fieldNameMap[ dbFieldName ];
    }
}


const racePublicFields = [
    'id',
    'username',
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

async function getRace( id ) {
    const races = await db.select( racePublicFields )
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
    return await db.select( racePublicFields )
        .from( 'races' )
        .where( 'username', username )
        .orderBy( 'date' );
}

async function createRace( data ) {
    //!!! if ( data.username !== loggedInUser ) return;
    const ids = await db.insert( {
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
        .into( 'races' )
    .catch( function ( err ) {
        throw convertRacesDbError( err );
    } );
    return ids[ 0 ];
}

async function updateRace( id, data ) {
    //!!! if ( username !== loggedInUser ) return;
    let newData = {};
    if ( data.name ) {
        newData.name = data.name;
    }
    if ( data.url ) {
        newData.url = data.url;
    }
    if ( data.resultsUrl ) {
        newData.results_url = data.resultsUrl;
    }
    if ( data.date ) {
        newData.date = data.date;
    }
    if ( data.city ) {
        newData.city = data.city;
    }
    if ( data.state ) {
        newData.state = data.state;
    }
    if ( data.country ) {
        newData.country = data.country;
    }
    if ( data.distance ) {
        newData.distance = data.distance;
    }
    if ( data.unit ) {
        newData.unit = data.unit;
    }
    if ( data.bib ) {
        newData.bib = data.bib;
    }
    if ( data.result ) {
        newData.result = data.result;
    }
    if ( data.chipTime ) {
        newData.chip_time = data.chipTime;
    }
    if ( data.gunTime ) {
        newData.gun_time = data.gunTime;
    }
    if ( data.overallPlace ) {
        newData.overall_place = data.overallPlace;
    }
    if ( data.overallTotal ) {
        newData.overall_total = data.overallTotal;
    }
    if ( data.genderPlace ) {
        newData.gender_place = data.genderPlace;
    }
    if ( data.genderTotal ) {
        newData.gender_total = data.genderTotal;
    }
    if ( data.divisionPlace ) {
        newData.division_place = data.divisionPlace;
    }
    if ( data.divisionTotal ) {
        newData.division_total = data.divisionTotal;
    }
    if ( data.divisionName ) {
        newData.division_name = data.divisionName;
    }
    if ( data.notes ) {
        newData.notes = data.notes;
    }
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
        const fieldNameMap = {
            'username': 'Username',
            'name': 'Race Name',
            'url': 'URL',
            'results_url': 'Results URL',
            'date': 'Date',
            'city': 'City',
            'state': 'State',
            'country': 'Country',
            'distance': 'Distance',
            'unit': 'Unit',
            'distance_unit': 'Unit',
            'bib': 'Bib',
            'result': 'Result',
            'result_type': 'Result',
            'chip_time': 'Chip Time',
            'gun_time': 'Gun Time',
            'overall_place': 'Overall Place',
            'overall_total': 'Overall Total',
            'gender_place': 'Gender Place',
            'gender_total': 'Gender Total',
            'division_place': 'Division Place',
            'division_total': 'Division Total',
            'division_name': 'Division Name',
            'notes': 'Notes'
        };
        return fieldNameMap[ dbFieldName ];
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
