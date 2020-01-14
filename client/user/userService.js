/*
    userService.js

    Manages user data on client side
*/

//=============================================================================

export default {
    create,
    get,
    update,
    remove,
    changePassword
};

//=============================================================================

import { request } from '../common/ajaxUtils.js';
import { GregDate } from '../common/gregDate.js';

const baseApiUrl = '/api/v1/users/';

//=============================================================================

function create( data ) {
    return request( {
        method: 'POST',
        url: baseApiUrl,
        data: data
    } );
}

//=============================================================================

function get( username ) {
    return request( {
        method: 'GET',
        url: baseApiUrl + username,
        dataType: 'json'
    } )
    .then( function( user ) {
        if ( user.dateOfBirth ) {
            user.dateOfBirth = new GregDate( user.dateOfBirth );
        }
        return user;
    } );
}

//=============================================================================

function update( username, newData ) {
    return request( {
        method: 'PUT',
        url: baseApiUrl + username,
        data: newData
    } );
}

//=============================================================================

function remove( username ) {
    return request( {
        method: 'DELETE',
        url: baseApiUrl + username
    } );
}

//=============================================================================

function changePassword( username, data ) {
    return request( {
        method: 'PUT',
        url: baseApiUrl + username + '/password',
        data: data
    } );
}

//=============================================================================
