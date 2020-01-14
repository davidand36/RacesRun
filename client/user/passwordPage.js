/*
    passwordPage.js

    (Change) Password page
*/


/*global $*/

//=============================================================================

export default {
    run
};

//=============================================================================

import page from '//unpkg.com/page/page.mjs';
import { getFormData, validateForm } from '../common/forms.js';
import userService from './userService.js';
import passwordTemplate from './passwordTemplate.js';
import { showErrorMessage, clearErrorMessage } from '../common/errorMessage.js';

//=============================================================================

async function run( username ) {
    render( );
    setEventHandlers( username );
}

//-----------------------------------------------------------------------------

function render( ) {
    $( 'h1' ).text( 'Change Password' );
    const passwordHtml = passwordTemplate( {});
    $( 'main' ).html( passwordHtml );
}

//-----------------------------------------------------------------------------

function setEventHandlers( username ) {
    $( '#changePassword' ).on( 'click', changePassword );
    $( '#showHidePassword' ).on( 'click', togglePasswordVisibility );

    //-------------------------------------------------------------------------

    const unauthorizedMsg = 'Current password is incorrect.';

    function changePassword() {
        const $passwordForm = $( '#passwordForm' );
        clearErrorMessage();
        if ( !validateForm( $passwordForm ) ) {
            return;
        }
        const formData = getFormData( $passwordForm );
        userService.changePassword( username, formData )
            .then( function() {
                page( '/profile' );
            } )
            .catch( function( errorMsg ) {
                let msg = ( errorMsg === 'Unauthorized' ) ? unauthorizedMsg : 'Error: ' + errorMsg;
                showErrorMessage( msg );
            } );
    }

    //-------------------------------------------------------------------------

    function togglePasswordVisibility() {
        let $pass = $( 'input[name="newPassword"]' );
        let $btn = $( '#showHidePassword' );
        if ( $pass.attr( 'type' ) === 'password' ) {
            $pass.attr( 'type', 'text' );
            $btn.text( 'Hide' );
        } else {
            $pass.attr( 'type', 'password' );
            $btn.text( 'Show' );
        }
    }
}

//=============================================================================
