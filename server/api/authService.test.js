/*
    authService.test.js

    Tests of authService

    See https://mochajs.org/
    and https://www.chaijs.com/
*/

const expect = require( 'chai' ).expect;
const authService = require( './authService' );

describe( 'authService', function () {
    describe( 'hashPassword', function( ) {
        it( 'generates an object with algorithm and key', async function( ) {
            const passHash = await authService.hashPassword( 'somepassword' );

            expect( passHash ).to.have.property( 'algorithm' );
            expect( passHash ).to.have.property( 'key' );
        } );

        it( 'returns null for empty password', async function( ) {
            const passHash = await authService.hashPassword( '' );

            expect( passHash ).to.be.null;
        } );
    } );

    describe( 'validatePassword', function( ) {
        let validPassword = 'somefinepassword';
        let passHash;
        beforeEach( async function( ) {
            passHash = await authService.hashPassword( validPassword );
        } );

        it ( 'validates the correct password', async function( ) {
            const result = await authService.validatePassword( validPassword, passHash );

            expect( result ).to.be.true;
        } );

        it( 'invalidates an incorrect password', async function( ) {
            const result = await authService.validatePassword( 'badpassword', passHash );

            expect( result ).to.be.false;
        } );
    } );

    describe( 'validateUser', function( ) {
        const dbService = require( './dbService' );
        let username;
        const validPassword = 'çok iyi bir şifre';

        beforeEach( async function( ) {
            await dbService.deleteAll( );
            username = await dbService.createUser( {
                username: 'username1',
                fullName: 'Full Name 1',
                email: 'username1@example.com',
                password: validPassword,
            } );
        } );

        it( 'validates the correct password', async function( ) {
            const result = await authService.validateUser( username, validPassword );

            expect( result ).to.be.true;
        } );

        it( 'invalidates an incorrect password', async function( ) {
            const result = await authService.validateUser( username, 'badpassword' );

            expect( result ).to.be.false;
        } );

        it( 'invalidates a non-existent user', async function( ) {
            const result = await authService.validateUser( 'nosuchuser', validPassword );

            expect( result ).to.be.false;
        } );
    } );
} );