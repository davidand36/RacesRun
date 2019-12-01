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
import { getNamedInputValue } from '../common/forms.js';
import auth from './auth.js';
import logInTemplate from './logInTemplate.js';

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
    const logInForm = $( '#logInForm' );
    $( '#logIn' ).on( 'click', logIn );

    //-------------------------------------------------------------------------

    const unauthorizedMsg = 'Incorrect username or password';

    function logIn( ) {
        const username = getNamedInputValue( 'username', logInForm );
        const password = getNamedInputValue( 'password', logInForm );
        auth.logIn( username, password )
        .then( function( ) {
            page( '/' );
        } ) 
        .catch( function( errorMsg ) {
            let msg = (errorMsg === 'Unauthorized') ? unauthorizedMsg : 'Error: ' + errorMsg;
            $( '#errorMsg' ).text( msg );
        } );

    }
}

//=============================================================================