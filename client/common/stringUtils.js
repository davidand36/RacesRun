/*
    stringUtils.js

    Utility functions regarding strings:

    padLeft: Returns a string, padded on the left out to the given length
*/

export function padLeft( string, length, padString ) {
    padString = padString || ' ';
    while ( string.length < length ) {
        string = padString + string;
    }
    return string;
}
