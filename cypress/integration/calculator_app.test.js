context( 'Running Calculator', () => {
    beforeEach( () => {
        cy.visit( '/calculator' );
    } );

    describe( 'Distance, Time, Pace', () => {
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
                .click();
            cy.get( '#distanceTimePace [name="pace_M"]' )
                .should( 'have.value', '4' );
            cy.get( '#distanceTimePace [name="pace_S"]' )
                .should( 'have.value', '45' );
        } );
    } );
} );