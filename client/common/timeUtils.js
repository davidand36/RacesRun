/*
    timeUtils.js

    Utility functions regarding time
*/

import { divModP } from './mathUtils.js';

export function hmsToSecs( h, m, s ) {
    if ( h || h === 0 || m || m === 0 || s || s === 0 ) {
        return 3600 * ( h || 0 )  +  60 * ( m || 0 )  +  ( +s || 0 );
    } else {
        return null;
    }
}

export function secsToHms( secs ) {
    if ( secs || secs === 0 ) {
        let qr = divModP( secs, 60 );
        let q = qr.quotient;
        let s = qr.remainder;
        qr = divModP( q, 60 );
        let h = qr.quotient;
        let m = qr.remainder;
        while ( s >= 60 ) {
            s -= 60;
            ++m;
        }
        while ( m >= 60 ) {
            m -= 60;
            ++h;
        }
        return { h, m, s };
    } else {
        return null;
    }
}
