/*
    racesRun.js

    Entry point for Races Run app

    See https://www.npmjs.com/package/page
*/

/*global $*/ //!!!

import page from '//unpkg.com/page/page.mjs';
import auth from './user/auth.js';
import nav from './nav/nav.js';
import logInPage from './user/logInPage.js';
import signUpPage from './user/signUpPage.js';

//=============================================================================

page( '*', getAuthStatus );
page( '*', runNavBar );
page( '/', showHomePage );
page( '/signup', showSignUpPage );
page( '/profile', showProfilePage );
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

function runNavBar( ctx, next ) {
    nav.run( ctx.authenticated, ctx.username );
    next( );
}

//=============================================================================

function showHomePage( ctx ) {
    if ( ctx.authenticated ) {
        showRacesPage( ctx.username, true );
    } else {
        showLoginPage( );
    }
}

//=============================================================================

function showLoginPage( ) {
    nav.setCurrentItem( 1 );
    logInPage.run( );
}

//=============================================================================

function showSignUpPage( ) {
    nav.setCurrentItem( 1 );
    signUpPage.run( );
}

//=============================================================================

function showProfilePage() {
    nav.setCurrentItem( 4 );
    $( 'h1' ).html( 'Profile Page' );
    $( 'main' ).empty();
}

//=============================================================================

function showRacesPage( username, isOwn ) {
    if ( isOwn ) {
        nav.setCurrentItem( 1 );
        $( 'h1' ).html( 'My Races Run' );
    } else {
        nav.setCurrentItem( 3 );
        $( 'h1' ).html( 'Races Run by ' + username );
    }
    $( 'main' ).empty();
}

//=============================================================================

function showCalcPage( ) {
    nav.setCurrentItem( 2 );
    $( 'h1' ).html( 'Calculator Page' );
    $( 'main' ).empty();
}

//=============================================================================

function showOtherRunnersPage( ) {
    nav.setCurrentItem( 3 );
    $( 'h1' ).html( 'Other Runners Page' );
    $( 'main' ).empty();
}

//=============================================================================

function handleUnknownRoute( ctx ) {
    console.log( 'Unknown route: ', ctx.path );
    page.redirect( '/' );
}

//=============================================================================
