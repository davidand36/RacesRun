/*
    distanceUtils.js

    Utility functions regarding distance
*/

export function kmToMi( km ) {
    return km * 0.62137119;
}

export function miToKm( mi ) {
    return mi * 1.609344; //exact
}

export function perKmToPerMi( perKm ) {
    return perKm * 1.609344;
}

export function perMiToPerKm( perMi ) {
    return perMi * 0.62137119;
}
