/*
    forms.js

    Getting and setting form data
*/

/*global $*/

import { hmsToSecs, secsToHms } from './timeUtils.js';
import { formatNumber } from './mathUtils.js';

//=============================================================================

export function getInputValue( $input ) {
    if ( !$input ) {
        return null;
    }
    const type = $input.attr( 'type' );
    if ( type === 'checkbox' ) {
        return $input.prop( 'checked' );
    } else if ( type === 'radio' ) {
        let $checkedButton = $input.filter( ':checked' );
        return $checkedButton.val();
    } else if ( type === 'number' ) {
        let val = parseFloat( $input.val() );
        return isNaN( val ) ? null : val;
    } else {
        return $input.val();
    }
}

//-----------------------------------------------------------------------------

export function getNamedInputValue( name, $form ) {
    const $input = $( '[name="' + name + '"]', $form );
    return getInputValue( $input );
}

//-----------------------------------------------------------------------------

export function getTimeInputValue( name, $form ) {
    const h = getNamedInputValue( name + '_H', $form );
    const m = getNamedInputValue( name + '_M', $form );
    const s = getNamedInputValue( name + '_S', $form );
    return hmsToSecs( h, m, s );
}

//=============================================================================

export function setInputValue( $input, value ) {
    if ( !$input ) {
        return;
    }
    const type = $input.attr( 'type' );
    if ( type === 'checkbox' ) {
        $input.prop( 'checked', value );
    } else if ( type === 'radio' ) {
        $input.val( [ value ] );
    } else {
        $input.val( value );
    }
}

//-----------------------------------------------------------------------------

export function setNamedInputValue( name, value, $form ) {
    let $input = $( '[name="' + name + '"]', $form );
    setInputValue( $input, value );
}

//-----------------------------------------------------------------------------

export function setTimeInputValue( name, seconds, $form ) {
    seconds = Math.round( seconds ); //!!! At least for now
    var hms = secsToHms( seconds );
    if ( hms.h ) {
        hms.m = formatNumber( hms.m, { minLength: 2, padString: '0' } );
    }
    hms.s = formatNumber( hms.s, { minLength: 2, padString: '0' } );
    setNamedInputValue( name + '_H', hms.h, $form );
    setNamedInputValue( name + '_M', hms.m, $form );
    setNamedInputValue( name + '_S', hms.s, $form );
}

//=============================================================================

export function getFormData( $form, options = {} ) {
    let data = {};
    $( ':input:not(button)', $form ).each( function() {
        const $input = $( this );
        const name = $input.attr( 'name' );
        if ( ! isTimeField( name ) ) {
            const val = getNamedInputValue( name );
            data[ name ] = val;
        }
    } );

    if ( options.timeFields ) {
        options.timeFields.forEach( function( name ) {
            const val = getTimeInputValue( name, $form );
            data[ name ] = val;
        } );
    }

    return data;

    //.........................................................................

    function isTimeField( name ) {
        const fieldRegEx = /^(\w+)_[HMS]$/;
        const match = fieldRegEx.exec( name );
        if ( ! match ) {
            return false;
        } else {
            return options.timeFields.includes( match[ 1 ] );
        }
    }
}

//=============================================================================

export function setFormData( data, $form, options = {} ) {
    Object.keys( data ).forEach( function( key ) {
        const val = data[ key ];
        if ( options.timeFields && options.timeFields.includes( key ) ) {
            setTimeInputValue( key, val, $form );
        } else {
            setNamedInputValue( key, val, $form );
        }
    } );
}

//=============================================================================