/*
    signUpPage.js

    Sign-up page
*/

/*global $*/

//=============================================================================

export default {
    run
};

//=============================================================================

import page from '//unpkg.com/page/page.mjs';
import { getFormData } from '../common/forms.js';
import userService from './userService.js';
import auth from './auth.js';
import profileTemplate from './profileTemplate.js';

//=============================================================================

function run() {
    render();
    setEventHandlers();
}

//-----------------------------------------------------------------------------

function render() {
    $( 'h1' ).text( 'Sign Up' );
    const signUpHtml = profileTemplate( { creating: true } );
    $( 'main' ).html( signUpHtml );
}

//-----------------------------------------------------------------------------

function setEventHandlers() {
    const profileForm = $( '#profileForm' );
    $( '#signUp' ).on( 'click', signUp );
    $( '#showHidePassword' ).on( 'click', togglePasswordVisibility );

    //-------------------------------------------------------------------------

    function signUp( ) {
        const formData = getFormData( profileForm );
        userService.create( formData )
        .then( function( ) {
            return auth.logIn( formData.username, formData.password );
        } )
        .then( function( ) {
            page( '/' );
        } )
        .catch( function( errorMsg ) {
            $( '#errorMsg' ).text( errorMsg );
        } );
    }

    //-------------------------------------------------------------------------

    function togglePasswordVisibility( ) {
        let $pass = $( 'input[name="password"]' );
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
