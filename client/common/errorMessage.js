/*
    errorMessage.js

    Display error messages
*/

/*global $*/

//=============================================================================

export function showErrorMessage( msg ) {
    let html;
    if ( typeof msg === 'string' ) {
        html = msg;
    } else if ( Array.isArray( msg ) ) {
        html = makeList( msg );
    }
    $('#error-message').html( html ).show();

    const pos = $('#error-message').offset();
    window.scrollTo( 0, pos.top );

    //-------------------------------------------------------------------------

    function makeList( arr ) {
        if ( arr.length === 1 ) { //Don't make a list with just one item.
            return arr[ 0 ];
        }
        const $ul = $('<ul>');
        arr.forEach( item => {
            const $li = $('<li>').html( item );
            $ul.append( $li );
        } );
        return $ul;
    }
}

//=============================================================================

export function clearErrorMessage( ) {
    $('#error-message').hide( ).empty( );
}

//=============================================================================
