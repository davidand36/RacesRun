/*
    mathUtils.js

    Utility functions regarding mathematics
*/

import { padLeft } from './stringUtils.js';

export function makeFinite( num, fallback ) {
    if ( isNaN( num ) || !isFinite( num ) )
        return fallback;
    return num;
}

export function clampInt( x, low, high ) {
    return Math.max( low, Math.min( x, high - 1 ) );
}

export function clampReal( x, low, high ) {
    return Math.max( low, Math.min( x, high ) );
}

export function wrap( x, low, high ) {
    var diff = high - low;
    while ( x < low )
        x += diff;
    while ( x >= high )
        x -= diff;
    return x;
}

export function modP( dividend, divisor ) {
    var rem = dividend % divisor;
    if ( rem < 0 )
        rem += divisor;
    return rem;
}

export function divModP( dividend, divisor ) {
    var qr = {
        quotient: Math.floor( dividend / divisor ),
        remainder: dividend % divisor
    };
    if ( qr.remainder < 0 )
        qr.remainder += divisor;
    return qr;
}

export function formatNumber( number, options ) {
    var str;
    options = options || {};
    options.decimals = options.decimals || 0;
    str = number.toFixed( options.decimals );
    if ( options.minLength ) {
        options.padString = options.padString || ' ';
        str = padLeft( str,
            options.minLength, options.padString );
    }
    return str;
}

export function toOrdinal( num ) {
    if ( ( num % 10 === 1 ) && ( num % 100 !== 11 ) ) {
        return num + 'st';
    }
    else if ( ( num % 10 === 2 ) && ( num % 100 !== 12 ) ) {
        return num + 'nd';
    }
    else if ( ( num % 10 === 3 ) && ( num % 100 !== 13 ) ) {
        return num + 'rd';
    }
    else {
        return num + 'th';
    }
}
