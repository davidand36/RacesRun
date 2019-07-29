/*
    runningCalculator.js

    Pace and unit conversion calculator
*/

/*global $, Handlebars*/

//=============================================================================

export default {
    run,
    stop
};

//=============================================================================

import calculatorTemplate from './calculatorTemplate.js';
import timeTemplate from '../common/_timeTemplate.js';
Handlebars.registerPartial( 'time', timeTemplate );
import { getNamedInputValue, getTimeInputValue, setNamedInputValue, setTimeInputValue } from '../common/forms.js';
import { kmToMi, miToKm, perKmToPerMi, perMiToPerKm } from '../common/distanceUtils.js';

//=============================================================================

function run( $containingElement ) {
    render( $containingElement );
    setEventHandlers( );
}

//-----------------------------------------------------------------------------

function stop( ) {
    clearEventHandlers( );
}

//=============================================================================

function render( $containingElement ) {
    // FUTURE: When supported, use import() for templates.
    let calculatorHtml = calculatorTemplate( {} );
    $containingElement.html( calculatorHtml );
}

//=============================================================================

function setEventHandlers( ) {
    const dtpForm = $( '#distanceTimePace' );
    const dcForm = $( '#distanceConversion' );
    const pcForm = $( '#paceConversion' );
    const tcForm = $( '#timeConversion' );
    const psForm = $( '#paceSpeedConversion' );
    $( '#computeDistance' ).on( 'click', computeDistance );
    $( '#computeTime' ).on( 'click', computeTime );
    $( '#computePace' ).on( 'click', computePace );
    $( '#convertMiToKm' ).on( 'click', convertMiToKm );
    $( '#convertKmToMi' ).on( 'click', convertKmToMi );
    $( '#convertPerMiToPerKm' ).on( 'click', convertPerMiToPerKm );
    $( '#convertPerKmToPerMi' ).on( 'click', convertPerKmToPerMi );
    $( '#convertSecsToHms' ).on( 'click', convertSecsToHms );
    $( '#convertHmsToSecs' ).on( 'click', convertHmsToSecs );
    $( '#convertSpeedToPace' ).on( 'click', convertSpeedToPace );
    $( '#convertPaceToSpeed' ).on( 'click', convertPaceToSpeed );

    //=========================================================================

    function computeDistance( ) {
        const time = getTimeInputValue( 'time', dtpForm );
        const pace = getTimeInputValue( 'pace', dtpForm );
        const distance = pace ? (time / pace) : 0;
        setNamedInputValue( 'distance', distance, dtpForm );
    }

    //-------------------------------------------------------------------------

    function computeTime( ) {
        const distance = getNamedInputValue( 'distance', dtpForm );
        const pace = getTimeInputValue( 'pace', dtpForm );
        const time = distance * pace;
        setTimeInputValue( 'time', time, dtpForm );
    }

    //-------------------------------------------------------------------------

    function computePace( ) {
        const distance = getNamedInputValue( 'distance', dtpForm );
        const time = getTimeInputValue( 'time', dtpForm );
        const pace = distance ? (time / distance ) : 0;
        setTimeInputValue( 'pace', pace, dtpForm );
    }

    //=========================================================================

    function convertMiToKm( ) {
        const mi = getNamedInputValue( 'distanceMi', dcForm );
        const km = miToKm( mi );
        setNamedInputValue( 'distanceKm', km, dcForm );
    }

    //-------------------------------------------------------------------------

    function convertKmToMi( ) {
        const km = getNamedInputValue( 'distanceKm', dcForm );
        const mi = kmToMi( km );
        setNamedInputValue( 'distanceMi', mi, dcForm );
    }

    //=========================================================================

    function convertPerMiToPerKm( ) {
        const perMi = getTimeInputValue( 'perMi', pcForm );
        const perKm = perMiToPerKm( perMi );
        setTimeInputValue( 'perKm', perKm, pcForm );
    }

    //-------------------------------------------------------------------------

    function convertPerKmToPerMi( ) {
        const perKm = getTimeInputValue( 'perKm', pcForm );
        const perMi = perKmToPerMi( perKm );
        setTimeInputValue( 'perMi', perMi, pcForm );
    }

    //=========================================================================

    function convertSecsToHms( ) {
        const secs = getNamedInputValue( 'seconds', tcForm );
        setTimeInputValue( 'hms', secs, tcForm );
    }

    //-------------------------------------------------------------------------

    function convertHmsToSecs( ) {
        const secs = getTimeInputValue( 'hms', tcForm );
        setNamedInputValue( 'seconds', secs, tcForm );
    }

    //=========================================================================

    function convertSpeedToPace( ) {
        const speed = getNamedInputValue( 'speed', psForm );
        const pace = speed ? (3600 / speed) : 0;
        setTimeInputValue( 'pace', pace, psForm );
    }

    //-------------------------------------------------------------------------

    function convertPaceToSpeed( ) {
        const pace = getTimeInputValue( 'pace', psForm );
        const speed = pace ? (3600 / pace) : 0;
        setNamedInputValue( 'speed', speed, psForm );
    }
}

//-----------------------------------------------------------------------------

function clearEventHandlers( ) {
    $( '#distTimePace, #distanceConversion, #paceConversion, #timeConversion', '#paceSpeedConversion' ).off( 'click', 'button' );
}

//=============================================================================
