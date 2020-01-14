/*
    editProfilePage.js

    Edit Profile page
*/


/*global $*/

//=============================================================================

export default {
    run
};

//=============================================================================

import page from '//unpkg.com/page/page.mjs';
import { setFormData, getFormData } from '../common/forms.js';
import userService from './userService.js';
import profileTemplate from './profileTemplate.js';
import { showErrorMessage, clearErrorMessage } from '../common/errorMessage.js';

//=============================================================================

async function run( username) {
    const user = await userService.get( username );
    render( user );
    setEventHandlers( username );
}

//-----------------------------------------------------------------------------

function render( user ) {
    $( 'h1' ).text( 'Edit Profile' );
    const templateData = Object.assign( { editing: true }, user );
    const signUpHtml = profileTemplate( templateData );
    $( 'main' ).html( signUpHtml );
    const profileForm = $( '#profileForm' );
    setFormData( user, profileForm );
}

//-----------------------------------------------------------------------------

function setEventHandlers( username ) {
    $( '#update' ).on( 'click', update );

    //-------------------------------------------------------------------------

    function update( ) {
        clearErrorMessage( );
        const profileForm = $( '#profileForm' );
        const formData = getFormData( profileForm );
        userService.update( username, formData )
        .then( function( ) {
            page( '/profile' );
        } )
        .catch( function( errorMsg ) {
            showErrorMessage( errorMsg );
        } );
    }
}

//=============================================================================
