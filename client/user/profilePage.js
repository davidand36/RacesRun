/*
    profilePage.js

    Profile page
*/

/*global $*/

//=============================================================================

export default {
    run
};

//=============================================================================

import userService from './userService.js';
import profileTemplate from './profileTemplate.js';

//=============================================================================

async function run( username ) {
    const user = await userService.get( username );
    render( user );

    //-------------------------------------------------------------------------

    function render( user ) {
        $( 'h1' ).text( 'Your Profile' );
        const profileHtml = profileTemplate( user );
        $( 'main' ).html( profileHtml );
    }
}

//=============================================================================
