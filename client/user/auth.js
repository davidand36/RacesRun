/*
    auth.js

    Handles user authorization from the client side.
*/

//=============================================================================

export default {
    logIn,
    logOut,
    getStatus
};

//=============================================================================

import { request } from '../common/ajaxUtils.js';

//=============================================================================

function logIn( username, password ) {
    return request( {
        method: 'POST',
        url: '/auth/login',
        data: {
            username,
            password
        }
    } );
}

//=============================================================================

function logOut( ) {
    return request( {
        method: 'POST',
        url: '/auth/logout'
    } );
}

//=============================================================================

function getStatus( ) {
    return request( {
        method: 'GET',
        url: '/auth/status',
        dataType: 'json'
    } );
}

//=============================================================================
