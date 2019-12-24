/*
    nav.js

    Navigation bar
*/

/*global $*/

//=============================================================================

export default {
    run,
    setCurrentItem
};

//=============================================================================

import userNavTemplate from './userNavTemplate.js';
import guestNavTemplate from './guestNavTemplate.js';

//=============================================================================

function run( loggedIn, username ) {
    const navHtml = loggedIn ? userNavTemplate( { username } ) : guestNavTemplate( {} );
    $( 'nav' ).html( navHtml );
    $('#menu-toggle').on( 'click', toggleMenu );
    $('.submenu-parent').on( 'click', toggleSubmenu );
}

//-----------------------------------------------------------------------------

function toggleMenu( ) {
    $( 'nav > ul' ).toggleClass( 'open' );
}

//-----------------------------------------------------------------------------

function toggleSubmenu( ) {
    $(this).children( 'ul' ).toggleClass( 'open' );
}

//=============================================================================

function setCurrentItem( index ) {
    const $item = $( 'nav li' ).eq( index );
    $item.addClass( 'current' );
}

//=============================================================================
