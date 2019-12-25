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
    addOpenWindowButton( );
}

//=============================================================================

let calculatorWindow = null;

function addOpenWindowButton( ) {
    const $div = $( '<div>' )
        .css( 'text-align', 'center' );
    const $btn = $( '<button>' )
        .attr( 'type', 'button' )
        .text( 'Open in a New Window' );
    $div.append( $btn );
    $( 'main' ).append( $div );
    $btn.on( 'click', openWindow );

    //-------------------------------------------------------------------------

    function openWindow( ) {
        if ( !calculatorWindow || calculatorWindow.closed ) {
            const url = '/calculator';
            const windowName = 'runnersCalculatorWindow';
            const options = 'width=380,height=580,resizable,scrollbars';
            calculatorWindow = window.open( url, windowName, options );
        } else {
            calculatorWindow.focus( );
        }
    }
}

//=============================================================================
