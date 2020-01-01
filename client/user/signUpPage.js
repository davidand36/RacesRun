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
import user from './user.js';
import auth from './auth.js';
import signUpTemplate from './signUpTemplate.js';

//=============================================================================

function run() {
    render();
    setEventHandlers();
}

//-----------------------------------------------------------------------------

function render() {
    $( 'h1' ).text( 'Sign Up' );
    const signUpHtml = signUpTemplate( {} );
    $( 'main' ).html( signUpHtml );
}

//-----------------------------------------------------------------------------

function setEventHandlers() {
    const signUpForm = $( '#signUpForm' );
    $( '#signUp' ).on( 'click', signUp );
    $( '#cancel' ).on( 'click', cancel );
    $( '#showHidePassword' ).on( 'click', togglePasswordVisibility );

    //-------------------------------------------------------------------------

    function signUp( ) {
        const formData = getFormData( signUpForm );
        user.create( formData )
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

    function cancel( ) {
        page( '/' );
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
