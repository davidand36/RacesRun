/*
    ajaxUtils.js

    Ajax routines
*/

/*global $*/

//=============================================================================

export function request( options ) {
    return new Promise( function( resolve, reject ) {
        $.ajax( options )
        .done( function( data ) {
            if ( typeof data === 'object' && data.error ) {
                reject( data.error );
            } else {
                resolve( data );
            }
        } )
        .fail( function( jqXhr ) {
            let errorMsg;
            if ( jqXhr.responseText ) {
                if ( jqXhr.responseText.charAt( 0 ) === '{' ) {
                    let response = JSON.parse( jqXhr.responseText );
                    if ( response.error ) {
                        errorMsg = response.error;
                    }
                } else {
                    errorMsg = jqXhr.responseText;
                }
            }
            if ( ! errorMsg ) {
                errorMsg = jqXhr.statusText;
            }
            reject( errorMsg );
        } );
    } );
}

//=============================================================================
