context( 'Running Calculator', () => {
    describe( 'App loading', () => {
        it( 'works with the URL path /calculator', () => {
            cy.visit( '/calculator' );
            cy.get( 'h1' )
                .should( 'contain', "Runner's Calculator" );
            cy.get( '#distanceTimePace' );
        } );

        it( 'works with the URL path /calculator/', () => {
            cy.visit( '/calculator/' );
            cy.get( 'h1' )
                .should( 'contain', "Runner's Calculator" );
            cy.get( '#distanceTimePace' );
        } );

        it( 'works with the URL path /calculator/index.html', () => {
            cy.visit( '/calculator/index.html' );
            cy.get( 'h1' )
                .should( 'contain', "Runner's Calculator" );
            cy.get( '#distanceTimePace' );
        } );
    } );

    describe( 'Distance, Time, Pace', () => {
        beforeEach( () => {
            cy.visit( '/calculator' );
        } );

        it( 'computes the distance', () => {
            cy.get( '#distanceTimePace [name="time_H"]' )
                .type( '1' );
            cy.get( '#distanceTimePace [name="time_M"]' )
                .type( '22' );
            cy.get( '#distanceTimePace [name="time_S"]' )
                .type( '30' );
            cy.get( '#distanceTimePace [name="pace_M"]' )
                .type( '7' );
            cy.get( '#distanceTimePace [name="pace_S"]' )
                .type( '30' );
            cy.get( '#computeDistance' )
                .click();
            cy.get( '#distanceTimePace [name="distance"]' )
                .should( 'have.value', '11' );
        } );

        it( 'computes the time', () => {
            cy.get( '#distanceTimePace [name="distance"]' )
                .type( '5' );
            cy.get( '#distanceTimePace [name="pace_M"]' )
                .type( '3' );
            cy.get( '#distanceTimePace [name="pace_S"]' )
                .type( '35' );
            cy.get( '#computeTime' )
                .click( );
            cy.get( '#distanceTimePace [name="time_H"]' )
                .should( 'have.value', '0' );
            cy.get( '#distanceTimePace [name="time_M"]' )
                .should( 'have.value', '17' );
            cy.get( '#distanceTimePace [name="time_S"]' )
                .should( 'have.value', '55' );
        } );

        it( 'computes the pace', () => {
            cy.get( '#distanceTimePace [name="distance"]' )
                .type( '10' );
            cy.get( '#distanceTimePace [name="time_H"]' )
                .type( '0' );
            cy.get( '#distanceTimePace [name="time_M"]' )
                .type( '47' );
            cy.get( '#distanceTimePace [name="time_S"]' )
                .type( '30' );
            cy.get( '#computePace' )
                .click( );
            cy.get( '#distanceTimePace [name="pace_M"]' )
                .should( 'have.value', '4' );
            cy.get( '#distanceTimePace [name="pace_S"]' )
                .should( 'have.value', '45' );
        } );
    } );

    describe( 'Distance Conversion', () => {
        beforeEach( () => {
            cy.visit( '/calculator' );
        } );

        it( 'converts kilometers to miles', () => {
            cy.get( '#distanceConversion [name="distanceKm"]' )
                .type( '15' );
            cy.get( '#convertKmToMi' )
                .click( );
            cy.get( '#distanceConversion [name="distanceMi"]' )
                .should( 'have.value', '9.32056785' );
        } );

        it( 'converts miles to kilometers', () => {
            cy.get( '#distanceConversion [name="distanceMi"]' )
                .type( '10' );
            cy.get( '#convertMiToKm' )
                .click( );
            cy.get( '#distanceConversion [name="distanceKm"]' )
                .should( 'have.value', '16.09344' );
        } );
    } );

    describe( 'Pace Conversion', () => {
        beforeEach( () => {
            cy.visit( '/calculator' );
        } );

        it( 'converts per kilometer pace to per mile', () => {
            cy.get( '#paceConversion [name="perKm_M"]' )
                .type( '4' );
            cy.get( '#paceConversion [name="perKm_S"]' )
                .type( '58' );
            cy.get( '#convertPerKmToPerMi' )
                .click( );
            cy.get( '#paceConversion [name="perMi_M"]' )
                .should( 'have.value', '8' );
            cy.get( '#paceConversion [name="perMi_S"]' )
                .should( 'have.value', '00' );
        } );

        it( 'converts per mile pace to per kilometer', () => {
            cy.get( '#paceConversion [name="perMi_M"]' )
                .type( '6' );
            cy.get( '#paceConversion [name="perMi_S"]' )
                .type( '45' );
            cy.get( '#convertPerMiToPerKm' )
                .click( );
            cy.get( '#paceConversion [name="perKm_M"]' )
                .should( 'have.value', '4' );
            cy.get( '#paceConversion [name="perKm_S"]' )
                .should( 'have.value', '12' );
        } );
    } );

    describe( 'Time Conversion', () => {
        beforeEach( () => {
            cy.visit( '/calculator' );
        } );

        it ( 'converts H:M:S to seconds', () => {
            cy.get( '#timeConversion [name="hms_H"]' )
                .type( '1' );
            cy.get( '#timeConversion [name="hms_M"]' )
                .type( '42' );
            cy.get( '#timeConversion [name="hms_S"]' )
                .type( '46' );
            cy.get( '#convertHmsToSecs' )
                .click( );
            cy.get( '#timeConversion [name="seconds"]' )
                .should( 'have.value', '6166' );
        } );

        it( 'converts seconds to H:M:S', () => {
            cy.get( '#timeConversion [name="seconds"]' )
                .type( '1344' );
            cy.get( '#convertSecsToHms' )
                .click( );
            cy.get( '#timeConversion [name="hms_H"]' )
                .should( 'have.value', '0' );
            cy.get( '#timeConversion [name="hms_M"]' )
                .should( 'have.value', '22' );
            cy.get( '#timeConversion [name="hms_S"]' )
                .should( 'have.value', '24' );
       } );
    } );

    describe( 'Pace-Speed Conversion', () => {
        beforeEach( () => {
            cy.visit( '/calculator' );
        } );

        it( 'convertes pace to speed', () => {
            cy.get( '#paceSpeedConversion [name="pace_M"]' )
                .type( '4' );
            cy.get( '#paceSpeedConversion [name="pace_S"]' )
                .type( '48' );
            cy.get( '#convertPaceToSpeed' )
                .click( );
            cy.get( '#paceSpeedConversion [name="speed"]' )
                .should( 'have.value', '12.5' );
        } );

        it( 'converts speed to pace', () => {
            cy.get( '#paceSpeedConversion [name="speed"]' )
                .type( '8.9' );
            cy.get( '#convertSpeedToPace' )
                .click( );
            cy.get( '#paceSpeedConversion [name="pace_M"]' )
                .should( 'have.value', '6' );
            cy.get( '#paceSpeedConversion [name="pace_S"]' )
                .should( 'have.value', '44' );
        } );
    } );
} );
