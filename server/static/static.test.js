/*
    static.test.js

    Test of static-file server, including single-page app routing


    See https://mochajs.org/
    and https://www.chaijs.com/
    and https://www.npmjs.com/package/request-promise-native
*/

require( 'dotenv' ).config();
const expect = require( 'chai' ).expect;
const request = require( 'request-promise-native' );

const urlBase = 'http://localhost:' + process.env.WEB_PORT;

describe( 'staticRouter', function( ) {

    it( 'Routes GET with no path to main index.html', async function( ) {
        const response = await request( {
            url: urlBase,
            headers: {
                accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            resolveWithFullResponse: true
        } );

        expect( response.statusCode ).to.equal( 200 );
        expect( response.headers[ 'content-type' ] ).to.match( /text\/html/ );
        expect( response.body ).to.match( /<title>Races Run<\/title>/ );
    } );

    it( 'Routes GET / to main index.html', async function() {
        const response = await request( {
            url: urlBase + '/',
            headers: {
                accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            resolveWithFullResponse: true
        } );

        expect( response.statusCode ).to.equal( 200 );
        expect( response.headers[ 'content-type' ] ).to.match( /text\/html/ );
        expect( response.body ).to.match( /<title>Races Run<\/title>/ );
    } );

    it( 'Routes GET /index.html to main index.html', async function() {
        const response = await request( {
            url: urlBase + '/index.html',
            headers: {
                accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            resolveWithFullResponse: true
        } );

        expect( response.statusCode ).to.equal( 200 );
        expect( response.headers[ 'content-type' ] ).to.match( /text\/html/ );
        expect( response.body ).to.match( /<title>Races Run<\/title>/ );
    } );

    it( 'Routes GET /somepath to main index.html', async function() {
        const response = await request( {
            url: urlBase + '/somepath',
            headers: {
                accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            resolveWithFullResponse: true
        } );

        expect( response.statusCode ).to.equal( 200 );
        expect( response.headers[ 'content-type' ] ).to.match( /text\/html/ );
        expect( response.body ).to.match( /<title>Races Run<\/title>/ );
    } );

    it( 'Routes GET /racesRun.css to main stylesheet', async function() {
        const response = await request( {
            url: urlBase + '/racesRun.css',
            headers: {
                accept: 'text/css,*/*;q=0.8'
            },
            resolveWithFullResponse: true
        } );

        expect( response.statusCode ).to.equal( 200 );
        expect( response.headers[ 'content-type' ] ).to.match( /text\/css/ );
        expect( response.body ).to.match( /Stylesheet for Races Run app/ );
    } );

    it( "Routes GET /calculator to runner's calculator index.html", async function() { //eslint-disable-line quotes
        const response = await request( {
            url: urlBase + '/calculator',
            headers: {
                accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            resolveWithFullResponse: true
        } );

        expect( response.statusCode ).to.equal( 200 );
        expect( response.headers[ 'content-type' ] ).to.match( /text\/html/ );
        expect( response.body ).to.match( /<title>Runner's Calculator<\/title>/ );
    } );

    it( "Routes GET /calculator/ to runner's calculator index.html", async function() { //eslint-disable-line quotes
        const response = await request( {
            url: urlBase + '/calculator/',
            headers: {
                accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            resolveWithFullResponse: true
        } );

        expect( response.statusCode ).to.equal( 200 );
        expect( response.headers[ 'content-type' ] ).to.match( /text\/html/ );
        expect( response.body ).to.match( /<title>Runner's Calculator<\/title>/ );
    } );

    it( "Routes GET /calculator/index.html to runner's calculator index.html", async function() { //eslint-disable-line quotes
        const response = await request( {
            url: urlBase + '/calculator/index.html',
            headers: {
                accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            resolveWithFullResponse: true
        } );

        expect( response.statusCode ).to.equal( 200 );
        expect( response.headers[ 'content-type' ] ).to.match( /text\/html/ );
        expect( response.body ).to.match( /<title>Runner's Calculator<\/title>/ );
    } );

    it( 'Routes GET /calculator/anypath to main index.html', async function() {
        const response = await request( {
            url: urlBase + '/calculator/anypath',
            headers: {
                accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            resolveWithFullResponse: true
        } );

        expect( response.statusCode ).to.equal( 200 );
        expect( response.headers[ 'content-type' ] ).to.match( /text\/html/ );
        expect( response.body ).to.match( /<title>Races Run<\/title>/ );
    } );

    it( 'Routes GET /calculator/calculator.css to calculator stylesheet', async function() {
        const response = await request( {
            url: urlBase + '/calculator/calculator.css',
            headers: {
                accept: 'text/css,*/*;q=0.8'
            },
            resolveWithFullResponse: true
        } );

        expect( response.statusCode ).to.equal( 200 );
        expect( response.headers[ 'content-type' ] ).to.match( /text\/css/ );
        expect( response.body ).to.match( /Stylesheet for runner's calculator/ );
    } );
} );
