/*
    calcPage.js

    Runner's Calculator page
*/

/*global $*/

//=============================================================================

export default {
    run
};

//=============================================================================

import runningCalculator from './runningCalculator.js';

//=============================================================================

function run( ) {
    $( 'h1' ).html( "Runner's Calculator" ); //eslint-disable-line 
    runningCalculator.run( $('main') );
}

//=============================================================================
