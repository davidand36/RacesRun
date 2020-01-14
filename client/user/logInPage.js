/*
    logInPage.js

    Log-in page
*/

/*global $*/

//=============================================================================

export default {
    run
};

//=============================================================================

import page from '//unpkg.com/page/page.mjs';
import { getNamedInputValue, validateForm } from '../common/forms.js';
import auth from './auth.js';
import logInTemplate from './logInTemplate.js';
import { showErrorMessage, clearErrorMessage } from '../common/errorMessage.js';

//=============================================================================

function run( ) {
    render( );
    setEventHandlers( );
}

//-----------------------------------------------------------------------------

function render( ) {
    $( 'h1' ).text( 'Log In' );
    const logInHtml = logInTemplate( {} );
    $( 'main' ).html( logInHtml );
}

//-----------------------------------------------------------------------------

function setEventHandlers( ) {
    $( '#logIn' ).on( 'click', logIn );

    //-------------------------------------------------------------------------

    const unauthorizedMsg = 'Incorrect username or password';

    function logIn( ) {
        const $logInForm = $( '#logInForm' );
        clearErrorMessage( );
        if ( ! validateForm( $logInForm ) ) {
            return;
        }
        const username = getNamedInputValue( 'username', $logInForm );
        const password = getNamedInputValue( 'password', $logInForm );
        auth.logIn( username, password )
        .then( function( ) {
            page( '/' );
        } ) 
        .catch( function( errorMsg ) {
            let msg = (errorMsg === 'Unauthorized') ? unauthorizedMsg : 'Error: ' + errorMsg;
            showErrorMessage( msg );
        } );
    }
}

//=============================================================================