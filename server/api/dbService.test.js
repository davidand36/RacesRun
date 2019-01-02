/*
    dbService.test.js

    Tests of dbService

    See https://mochajs.org/
    and https://www.chaijs.com/
*/

const expect = require( 'chai' ).expect;
const dbService = require( './dbService' );

describe( 'dbService', function( ) {
    beforeEach( async function( ) {
        dbService.deleteAll( );
    } );

    after( dbService.disconnect );

    describe( 'createUser', function( ) {
        it( 'adds a user to the DB', async function( ) {
            const fullData = {
                username: 'username1',
                fullName: 'Full Name 1',
                gender: 'male',
                dateOfBirth: new Date( 1969, 6, 20 ),
                email: 'username1@example.com',
                visibility: 'all',
                password: 'secret1'
            };
            const username = await dbService.createUser( fullData );

            expect( username ).to.equal( fullData.username );
        } );

        it( 'does not require all fields', async function( ) {
            const minimalData = {
                username: 'username1',
                fullName: 'Full Name 1',
                password: 'secret1',
            };
            const username = await dbService.createUser( minimalData );

            expect( username ).to.equal( minimalData.username );
        } );

        it( 'requires username', async function( ) {
            const badData = {
                fullName: 'Full Name 1',
                password: 'secret1',
            };
            await dbService.createUser( badData )
                .catch( function( err ) {
                    expect( err.message ).to.match( /Data Error: required field missing: username/ );
                } );
        } );

        it( 'requires fullNname', async function( ) {
            const badData = {
                username: 'username1',
                password: 'secret1',
            };
            await dbService.createUser( badData )
                .catch( function ( err ) {
                    expect( err.message ).to.match( /Data Error: required field missing: full_name/ );
                } );
        } );

        it( 'requires password', async function( ) {
            const badData = {
                username: 'username1',
                fullName: 'Full Name 1'
            };
            await dbService.createUser( badData )
                .catch( function ( err ) {
                    expect( err.message ).to.match( /Data Error: required field missing: pass/ );
                } );
        } );

        it( 'limits the length of username', async function( ) {
            const badData = {
                username: '123456789012345678901234567890',
                fullName: 'Full Name 1',
                password: 'secret1',
            };
            await dbService.createUser( badData )
                .catch( function ( err ) {
                    expect( err.message ).to.match( /Data Error: invalid data/ );
                } );
        } );

        it( 'requires unique usernames', async function( ) {
            const data1 = {
                username: 'username1',
                fullName: 'Full Name 1',
                password: 'secret1',
            };
            const data2 = {
                username: 'username1',
                fullName: 'Full Name 1',
                password: 'secret1',
            };
            await dbService.createUser( data1 )
            await dbService.createUser( data2 )
                .catch( function( err ) {
                    expect( err.message ).to.match( /Data Error: duplicate value/ );
                } );
        } );
    } );

    describe( 'getUsers', function( ) {
        beforeEach( async function( ) {
            await dbService.createUser( {
                username: 'username1',
                fullName: 'Full Name 1',
                email: 'username1@example.com',
                password: 'secret1',
            } );
            await dbService.createUser( {
                username: 'username2',
                fullName: 'Full Name 2',
                password: 'secret2',
            } );
        } );

        it( 'gets all users in the DB', async function( ) {
            const users = await dbService.getUsers( );

            expect( users.length ).to.equal( 2 );
            expect( users[ 1 ].fullName ).to.equal( 'Full Name 2' );
        } );

        it( 'does not get email addresses', async function( ) {
            const users = await dbService.getUsers();

            expect( users[ 0 ].email ).to.be.undefined;
        } );
    } );

    describe( 'getUser', function( ) {
        beforeEach( async function () {
            await dbService.createUser( {
                username: 'username1',
                fullName: 'Full Name 1',
                email: 'username1@example.com',
                password: 'secret1',
            } );
            await dbService.createUser( {
                username: 'username2',
                fullName: 'Full Name 2',
                password: 'secret2',
            } );
        } );

        it( 'gets user info by username', async function( ) {
            const user = await dbService.getUser( 'username2' );

            expect( user.fullName ).to.equal( 'Full Name 2' );
        } );

        it( 'returns null for non-existent username', async function( ) {
            const user = await dbService.getUser( 'nosuchuser' );

            expect( user ).to.be.null;
        } );

        it( 'gets email address if present', async function( ) {
            const user = await dbService.getUser( 'username1' );

            expect( user.email ).to.equal( 'username1@example.com' );
        } );
    } );


} );