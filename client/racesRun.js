/*
    racesRun.js

    Entry point for Races Run app

    See https://www.npmjs.com/package/page
*/

/*global $*/ //!!!

import page from '//unpkg.com/page/page.mjs';
import auth from './user/auth.js';
import logInPage from './user/logInPage.js';
import signUpPage from './user/signUpPage.js';

//=============================================================================

page( '*', getAuthStatus );
page( '/', showHomePage );
page( '/signup', showSignUpPage );
page( '/calc', showCalcPage );
page( '/others', showOtherRunnersPage );
page( '*', handleUnknownRoute );
page( );

//=============================================================================

async function getAuthStatus( ctx, next ) {
    let status = await auth.getStatus();
    Object.assign( ctx, status );
    next( );
}

//=============================================================================

function showHomePage( ctx ) {
    if ( ctx.authenticated && ctx.username ) {
        showRacesPage( ctx.username, true );
    } else {
        showLoginPage( );
    }
}

//=============================================================================

function showLoginPage( ) {
    logInPage.run( );
}

//=============================================================================

function showSignUpPage( ) {
    signUpPage.run( );
}

//=============================================================================

function showRacesPage( username, isOwn ) {
    if ( isOwn ) {
        $( 'h1' ).html( 'My Races Run' );
    } else {
        $( 'h1' ).html( 'Races Run by ' + username );
    }
    $( 'main' ).empty();
}

//=============================================================================

function showCalcPage( ) {
    $( 'h1' ).html( 'Calculator Page' );
    $( 'main' ).empty();
}

//=============================================================================

function showOtherRunnersPage( ) {
    $( 'h1' ).html( 'Other Runners Page' );
    $( 'main' ).empty();
}

//=============================================================================

function handleUnknownRoute( ctx ) {
    console.log( 'Unknown route: ', ctx.path );
    page.redirect( '/' );
}

//=============================================================================
