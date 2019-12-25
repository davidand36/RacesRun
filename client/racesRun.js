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
import calcPage from './calculator/calcPage.js';

//=============================================================================

page( '*', getAuthStatus );
page( '*', runNavBar );
page( '/', showHomePage );
page( '/logout', logOut );
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
    nav.setCurrentItem( 'home' );
    logInPage.run( );
}

//=============================================================================

async function logOut( ) {
    await auth.logOut( );
    page( '/' );
}

//=============================================================================

function showSignUpPage( ) {
    nav.setCurrentItem( 'home' );
    signUpPage.run( );
}

//=============================================================================

function showProfilePage() {
    nav.setCurrentItem( 'profile' );
    $( 'h1' ).html( 'Profile Page' );
    $( 'main' ).empty();
}

//=============================================================================

function showRacesPage( username, isOwn ) {
    if ( isOwn ) {
        nav.setCurrentItem( 'home' );
        $( 'h1' ).html( 'My Races Run' );
    } else {
        nav.setCurrentItem( 'others' );
        $( 'h1' ).html( 'Races Run by ' + username );
    }
    $( 'main' ).empty();
}

//=============================================================================

function showCalcPage( ) {
    nav.setCurrentItem( 'calc' );
    calcPage.run( );
}

//=============================================================================

function showOtherRunnersPage( ) {
    nav.setCurrentItem( 'others' );
    $( 'h1' ).html( 'Other Runners Page' );
    $( 'main' ).empty();
}

//=============================================================================

function handleUnknownRoute( ctx ) {
    console.log( 'Unknown route: ', ctx.path );
    page.redirect( '/' );
}

//=============================================================================
