/*
    routes.test.js

    Tests of API routes


    See https://mochajs.org/
    and https://www.chaijs.com/
    and https://www.npmjs.com/package/request-promise-native
*/

require( 'dotenv' ).config();
const expect = require( 'chai' ).expect;
const request = require( 'request-promise-native' );
const dbService = require( '../api/dbService' );

const authUrl = 'http://localhost:' + process.env.WEB_PORT + '/auth';

describe( 'authRouter', function() {
    before( async function() {
        await dbService.reconnect();
    } );

    beforeEach( async function() {
        await dbService.deleteAll();
        await dbService.createUser( {
            username: 'username1',
            fullName: 'Full Name 1',
            password: 'secret1'
        } );
        await dbService.createUser( {
            username: 'username2',
            fullName: 'Full Name 2',
            password: 'secret2',
        } );
    } );

    afterEach( async function() {
        await request( {
            method: 'POST',
            url: authUrl + '/logout',
            jar: true
        } );
    } );

    after( dbService.disconnect );

    describe( 'POST /login', function( ) {
        it( 'returns 200 on valid login', async function( ) {
            const response = await request( {
                method: 'POST',
                url: authUrl + '/login',
                body: {
                    username: 'username1',
                    password: 'secret1'
                },
                json: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 200 );
            expect( response.body ).to.equal( 'username1' );
        } );

        it( 'returns 401 on invalid username', async function( ) {
            const response = await request( {
                method: 'POST',
                url: authUrl + '/login',
                body: {
                    username: 'nosuchuser',
                    password: 'secret1'
                },
                json: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 401 );
        } );

        it( 'returns 401 on invalid password', async function( ) {
            const response = await request( {
                method: 'POST',
                url: authUrl + '/login',
                body: {
                    username: 'username1',
                    password: 'badpass'
                },
                json: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 401 );
        } );

        it( 'returns 401 on missing username', async function( ) {
            const response = await request( {
                method: 'POST',
                url: authUrl + '/login',
                body: {
                    password: 'secret1'
                },
                json: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 401 );
        } );

        it( 'returns 401 on missing password', async function( ) {
            const response = await request( {
                method: 'POST',
                url: authUrl + '/login',
                body: {
                    username: 'username1'
                },
                json: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 401 );
        } );
    } );

    describe( 'POST /logout', function ( ) {
        it( 'returns 200', async function( ) {
            const response = await request( {
                method: 'POST',
                url: authUrl + '/logout',
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 200 );
            expect( response.body ).to.equal( 'OK' );
        } );
    } );

    describe( 'GET /status', function( ) {
        it( 'returns authenticated:false if not logged in', async function( ) {
            const status = await request( {
                method: 'GET',
                url: authUrl + '/status',
                json: true,
                jar: true
            } );

            expect( status.authenticated ).to.be.false;
            expect( status.username ).to.be.undefined;
        } );

        it( 'returns authenticated:true if logged in', async function( ) {
            await request( {
                method: 'POST',
                url: authUrl + '/login',
                body: {
                    username: 'username1',
                    password: 'secret1'
                },
                json: true,
                jar: true, //enables cookies
                resolveWithFullResponse: true,
                simple: false
            } );
            const status = await request( {
                method: 'GET',
                url: authUrl + '/status',
                json: true,
                jar: true
            } );

            expect( status.authenticated ).to.be.true;
            expect( status.username ).to.equal( 'username1' );
        } );

        it( 'returns authenticated:false after logout', async function() {
            await request( {
                method: 'POST',
                url: authUrl + '/login',
                body: {
                    username: 'username1',
                    password: 'secret1'
                },
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );
            await request( {
                method: 'POST',
                url: authUrl + '/logout',
                json: true,
                jar: true
            } );
            const status = await request( {
                method: 'GET',
                url: authUrl + '/status',
                json: true,
                jar: true
            } );

            expect( status.authenticated ).to.be.false;
            expect( status.username ).to.be.undefined;
        } );
    } );
} );