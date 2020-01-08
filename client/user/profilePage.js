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
        $( 'h1' ).text( 'My Profile' );
        if ( user.dateOfBirth ) {
            user.dateOfBirthString = user.dateOfBirth.toString( 'long' );
        }
        const templateData = Object.assign( { viewing: true }, user );
        const profileHtml = profileTemplate( templateData );
        $( 'main' ).html( profileHtml );
    }
}

//=============================================================================
