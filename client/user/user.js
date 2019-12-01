/*
    user.js

    Manages user data on client side
*/

//=============================================================================

export default {
    create,
    get,
    update,
    destroy   
};

//=============================================================================

import { request } from '../common/ajaxUtils.js';

//=============================================================================

function create( data ) {
    return request( {
        method: 'POST',
        url: '/api/v1/users',
        data: data
    } );
}

//=============================================================================

function get( username ) {
    return request( {
        method: 'GET',
        url: '/api/v1/users/' + username,
        dataType: 'json'
    } );
}

//=============================================================================

function update( username, newData ) {
    return request( {
        method: 'PUT',
        url: '/api/v1/users/' + username,
        data: newData
    } );
}

//=============================================================================

function destroy( username ) {
    return request( {
        method: 'DELETE',
        url: '/api/v1/users/' + username
    } );
}

//=============================================================================
