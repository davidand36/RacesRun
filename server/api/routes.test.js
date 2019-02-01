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
const dbService = require( './dbService' );

const apiUrl = 'http://localhost:' + process.env.WEB_PORT + '/api/v1';
const authUrl = 'http://localhost:' + process.env.WEB_PORT + '/auth';

describe( 'apiRouter', function( ) {
    before( async function( ) {
        await dbService.reconnect( );
    } );

    beforeEach( async function( ) {
        await dbService.deleteAll( );
    } );

    afterEach( async function( ) {
        await logOut( );
    } );

    after( dbService.disconnect );


    async function logInAsUserNum( userNum ) {
        await request( {
            method: 'POST',
            url: authUrl + '/login',
            body: {
                username: 'username' + userNum,
                password: 'secret' + userNum
            },
            json: true,
            jar: true //enables cookies
        } );
    }

    async function logOut() {
        await request( {
            method: 'POST',
            url: authUrl + '/logout',
            jar: true
        } );
    }


    describe( 'POST /users', function( ) {
        it( 'returns 201 as status and the username as body on success', async function( ) {
            const response = await request( {
                method: 'POST',
                url: apiUrl + '/users',
                body: {
                    username: 'username1',
                    fullName: 'Full Name 1',
                    gender: 'male',
                    dateOfBirth: new Date( 1969, 6, 20 ),
                    email: 'username1@example.com',
                    visibility: 'all',
                    password: 'secret1'
                },
                json: true,
                resolveWithFullResponse: true,
                simple: false
            } );
            expect( response.statusCode ).to.equal( 201 );
            expect( response.body ).to.equal( 'username1' );
        } );

        it( 'does not require all fields', async function( ) {
            const response = await request( {
                method: 'POST',
                url: apiUrl + '/users',
                body: {
                    username: 'username1',
                    fullName: 'Full Name 1',
                    password: 'secret1'
                },
                json: true,
                resolveWithFullResponse: true,
                simple: false
            } );
            expect( response.statusCode ).to.equal( 201 );
            expect( response.body ).to.equal( 'username1' );
        } );

        it( 'returns 400 error if no username provided', async function( ) {
            const response = await request( {
                method: 'POST',
                url: apiUrl + '/users',
                body: {
                    fullName: 'Full Name 1',
                    password: 'secret1'
                },
                json: true,
                resolveWithFullResponse: true,
                simple: false
            } );
            expect( response.statusCode ).to.equal( 400 );
            expect( response.body.error ).to.equal( 'Data Error: Username is required' );
        } );

        it( 'returns 400 error if no fullName provided', async function( ) {
            const response = await request( {
                method: 'POST',
                url: apiUrl + '/users',
                body: {
                    username: 'username1',
                    password: 'secret1',
                },
                json: true,
                resolveWithFullResponse: true,
                simple: false
            } );
            expect( response.statusCode ).to.equal( 400 );
            expect( response.body.error ).to.equal( 'Data Error: Full Name is required' );
        } );

        it( 'returns 400 error if no password provided', async function( ) {
            const response = await request( {
                method: 'POST',
                url: apiUrl + '/users',
                body: {
                    username: 'username1',
                    fullName: 'Full Name 1'
                },
                json: true,
                resolveWithFullResponse: true,
                simple: false
            } );
            expect( response.statusCode ).to.equal( 400 );
            expect( response.body.error ).to.equal( 'Data Error: Password is required' );
        } );

        it( 'limits the length of username', async function( ) {
            const response = await request( {
                method: 'POST',
                url: apiUrl + '/users',
                body: {
                    username: '12345678901234567890123456',
                    fullName: 'Full Name 1',
                    password: 'secret1'
                },
                json: true,
                resolveWithFullResponse: true,
                simple: false
            } );
            expect( response.statusCode ).to.equal( 400 );
            expect( response.body.error ).to.equal( 'Data Error: invalid data' );
        } );

        it( 'requires unique usernames', async function( ) {
            await request( {
                method: 'POST',
                url: apiUrl + '/users',
                body: {
                    username: 'username1',
                    fullName: 'Full Name 1',
                    password: 'secret1'
                },
                json: true
            } );
            const response = await request( {
                method: 'POST',
                url: apiUrl + '/users',
                body: {
                    username: 'username1',
                    fullName: 'Full Name 2',
                    password: 'secret2'
                },
                json: true,
                resolveWithFullResponse: true,
                simple: false
            } );
            expect( response.statusCode ).to.equal( 400 );
            expect( response.body.error ).to.equal( 'Data Error: This Username is already registered' );
        } );

        it( 'requires unique emails', async function( ) {
            await request( {
                method: 'POST',
                url: apiUrl + '/users',
                body: {
                    username: 'username1',
                    fullName: 'Full Name 1',
                    email: 'username1@example.com',
                    password: 'secret1',
                },
                json: true
            } );
            const response = await request( {
                method: 'POST',
                url: apiUrl + '/users',
                body: {
                    username: 'username2',
                    fullName: 'Full Name 2',
                    email: 'username1@example.com',
                    password: 'secret2',
                },
                json: true,
                resolveWithFullResponse: true,
                simple: false
            } );
            expect( response.statusCode ).to.equal( 400 );
            expect( response.body.error ).to.equal( 'Data Error: This Email Address is already registered' );
        } );

        it( 'rejects invalid gender', async function( ) {
            const response = await request( {
                method: 'POST',
                url: apiUrl + '/users',
                body: {
                    username: 'username1',
                    fullName: 'Full Name 1',
                    gender: 'woman',
                    password: 'secret1'
                },
                json: true,
                resolveWithFullResponse: true,
                simple: false
            } );
            expect( response.statusCode ).to.equal( 400 );
            expect( response.body.error ).to.equal( 'Data Error: Invalid value for Gender' );
        } );

        it( 'rejects invalid visibility', async function( ) {
            const response = await request( {
                method: 'POST',
                url: apiUrl + '/users',
                body: {
                    username: 'username1',
                    fullName: 'Full Name 1',
                    visibility: 'everyone',
                    password: 'secret1'
                },
                json: true,
                resolveWithFullResponse: true,
                simple: false
            } );
            expect( response.statusCode ).to.equal( 400 );
            expect( response.body.error ).to.equal( 'Data Error: Invalid value for Visibility' );
        } );
    } );

    async function create3Users( ) {
        await request( {
            method: 'POST',
            url: apiUrl + '/users',
            body: {
                username: 'username1',
                fullName: 'Full Name 1',
                gender: 'male',
                dateOfBirth: new Date( 1969, 6, 20 ),
                email: 'username1@example.com',
                visibility: 'all',
                password: 'secret1'
            },
            json: true
        } );
        await request( {
            method: 'POST',
            url: apiUrl + '/users',
            body: {
                username: 'username2',
                fullName: 'Full Name 2',
                password: 'secret2'
            },
            json: true
        } );
        await request( {
            method: 'POST',
            url: apiUrl + '/users',
            body: {
                username: 'username3',
                fullName: 'Full Name 3',
                password: 'secret3',
                visibility: 'users'
            },
            json: true
        } );
    }

    describe( 'GET /users', function( ) {
        beforeEach( create3Users );

        it( 'gets all users in the DB', async function( ) {
            const users = await request( {
                method: 'GET',
                url: apiUrl + '/users',
                json: true,
                jar: true
            } );

            expect( users.length ).to.equal( 3 );
            expect( users[ 1 ].fullName ).to.equal( 'Full Name 2' );
        } );

        it( 'does not get email addresses', async function( ) {
            const users = await request( {
                method: 'GET',
                url: apiUrl + '/users',
                json: true,
                jar: true
            } );

            expect( users[ 0 ].email ).to.be.undefined;
        } );
    } );

    describe( 'GET /users/:username', function( ) {
        beforeEach( create3Users );

        it( 'returns 403 if not logged in', async function( ) {
            const response = await request( {
                method: 'GET',
                url: apiUrl + '/users/' + 'username1',
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 403 );
        } );

        it( 'returns 403 if not logged in as a different user', async function( ) {
            await logInAsUserNum( 2 );
            const response = await request( {
                method: 'GET',
                url: apiUrl + '/users/' + 'username1',
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 403 );
        } );

        it( 'gets user info by username', async function( ) {
            await logInAsUserNum( 2 );
            const user = await request( {
                method: 'GET',
                url: apiUrl + '/users/' + 'username2',
                json: true,
                jar: true
            } );

            expect( user.fullName ).to.equal( 'Full Name 2' );
        } );

        it( 'returns 403 for non-existent username', async function( ) {
            await logInAsUserNum( 1 );
            const response = await request( {
                method: 'GET',
                url: apiUrl + '/users/' + 'nosuchuser',
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 403 );
        } );

        it( 'gets email address if present', async function( ) {
            await logInAsUserNum( 1 );
            const user = await request( {
                method: 'GET',
                url: apiUrl + '/users/' + 'username1',
                json: true,
                jar: true
            } );

            expect( user.email ).to.equal( 'username1@example.com' );
        } );
    } );

    describe( 'PUT /users/:username', function( ) {
        beforeEach( create3Users );

        it( 'returns 403 if not logged in', async function( ) {
            const newData = {
                fullName: 'New Name 1',
                gender: 'female',
                dateOfBirth: new Date( 1999, 9, 9 ),
                email: 'username1@foobar.org',
                visibilty: 'users'
            };
            const response = await request( {
                method: 'PUT',
                url: apiUrl + '/users/' + 'username1',
                body: newData,
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 403 );
        } );

        it( 'returns 403 if not logged in as a different user', async function( ) {
            const newData = {
                fullName: 'New Name 1',
                gender: 'female',
                dateOfBirth: new Date( 1999, 9, 9 ),
                email: 'username1@foobar.org',
                visibilty: 'users'
            };
            await logInAsUserNum( 2 );
            const response = await request( {
                method: 'PUT',
                url: apiUrl + '/users/' + 'username1',
                body: newData,
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 403 );
        } );

        it( 'updates most fields', async function( ) {
            const newData = {
                fullName: 'New Name 1',
                gender: 'female',
                dateOfBirth: new Date( 1999, 9, 9 ),
                email: 'username1@foobar.org',
                visibilty: 'users'
            };
            await logInAsUserNum( 1 );
            await request( {
                method: 'PUT',
                url: apiUrl + '/users/' + 'username1',
                body: newData,
                json: true,
                jar: true
            } );
            const user = await request( {
                method: 'GET',
                url: apiUrl + '/users/' + 'username1',
                json: true,
                jar: true
            } );

            expect( user.fullName ).to.equal( newData.fullName );
            expect( user.gender ).to.equal( newData.gender );
            expect( user.dateOfBirth ).to.equal( newData.dateOfBirth.toJSON() );
            expect( user.email ).to.equal( newData.email );
        } );

        it( 'does not change username', async function( ) {
            const newData = {
                username: 'newusername1'
            };
            await logInAsUserNum( 1 );
            await request( {
                method: 'PUT',
                url: apiUrl + '/users/' + 'username1',
                body: newData,
                json: true,
                jar: true
            } );
            const user = await request( {
                method: 'GET',
                url: apiUrl + '/users/' + 'username1',
                json: true,
                jar: true
            } );

            expect( user.username ).to.equal( 'username1' );
        } );

        it( 'does not change password', async function( ) {
            const authService = require( '../auth/authService' );
            const newData = {
                password: 'newpassword1'
            };
            await logInAsUserNum( 1 );
            await request( {
                method: 'PUT',
                url: apiUrl + '/users/' + 'username1',
                body: newData,
                json: true,
                jar: true
            } );
            const valRslt1 = await authService.validateUser( 'username1', 'secret1' );
            const valRslt2 = await authService.validateUser( 'username1', 'newpassword1' );

            expect( valRslt1 ).to.be.true;
            expect( valRslt2 ).to.be.false;
        } );

        it( 'does not affect other users', async function( ) {
            const newData = {
                fullName: 'New Name 1',
                gender: 'female',
                dateOfBirth: new Date( 1999, 9, 9 ),
                email: 'username1@foobar.org',
                visibilty: 'users'
            };
            await logInAsUserNum( 1 );
            await request( {
                method: 'PUT',
                url: apiUrl + '/users/' + 'username1',
                body: newData,
                json: true,
                jar: true
            } );
            await logInAsUserNum( 2 );
            const user2 = await request( {
                method: 'GET',
                url: apiUrl + '/users/' + 'username2',
                json: true,
                jar: true
            } );

            expect( user2.fullName ).to.equal( 'Full Name 2' );
            expect( user2.gender ).to.be.null;
            expect( user2.dateOfBirth ).to.be.null;
            expect( user2.email ).to.be.null;
        } );

        it( 'returns 403 if not logged in', async function( ) {
            const response = await request( {
                method: 'GET',
                url: apiUrl + '/users/' + 'username1',
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 403 );
        } );
    } );

    describe( 'PUT /users/:username/password', function( ) {
        beforeEach( create3Users );

        it( 'returns 403 if not logged in', async function( ) {
            const data = {
                currentPassword: 'secret1',
                newPassword: 'newpassword1'
            };
            const response = await request( {
                method: 'PUT',
                url: apiUrl + '/users/' + 'username1' + '/password',
                body: data,
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 403 );
        } );

        it( 'returns 403 if not logged in as a different user', async function( ) {
            const data = {
                currentPassword: 'secret1',
                newPassword: 'newpassword1'
            };
            await logInAsUserNum( 2 );
            const response = await request( {
                method: 'PUT',
                url: apiUrl + '/users/' + 'username1' + '/password',
                body: data,
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 403 );
        } );

        it( 'changes the password when the old one is supplied', async function( ) {
            const authService = require( '../auth/authService' );
            const data = {
                currentPassword: 'secret1',
                newPassword: 'newpassword1'
            };
            await logInAsUserNum( 1 );
            await request( {
                method: 'PUT',
                url: apiUrl + '/users/' + 'username1' + '/password',
                body: data,
                json: true,
                jar: true
            } );
            const valRslt = await authService.validateUser( 'username1', 'newpassword1' );

            expect( valRslt ).to.be.true;
        } );

        it( 'returns 401 if wrong old password given', async function( ) {
            const data = {
                currentPassword: 'wrongpass1',
                newPassword: 'newpassword1'
            };
            await logInAsUserNum( 1 );
            const response = await request( {
                method: 'PUT',
                url: apiUrl + '/users/' + 'username1' + '/password',
                body: data,
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 401 );
        } );

        it( 'returns 401 if no old password given', async function( ) {
            const data = {
                newPassword: 'newpassword1'
            };
            await logInAsUserNum( 1 );
            const response = await request( {
                method: 'PUT',
                url: apiUrl + '/users/' + 'username1' + '/password',
                body: data,
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 401 );
        } );
    } );

    describe( 'DELETE  /users/:username', function( ) {
        beforeEach( create3Users );

        it( 'returns 403 if not logged in', async function( ) {
            const response = await request( {
                method: 'DELETE',
                url: apiUrl + '/users/' + 'username1',
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 403 );
        } );

        it( 'returns 403 if not logged in as a different user', async function( ) {
            await logInAsUserNum( 2 );
            const response = await request( {
                method: 'DELETE',
                url: apiUrl + '/users/' + 'username1',
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 403 );
        } );

        it( 'removes a user', async function( ) {
            await logInAsUserNum( 1 );
            await request( {
                method: 'DELETE',
                url: apiUrl + '/users/' + 'username1',
                jar: true
            } );
            await logInAsUserNum( 2 );
            const users = await request( {
                method: 'GET',
                url: apiUrl + '/users',
                json: true,
                jar: true
            } );

            expect( users.length ).to.equal( 2 ); //!!!
            expect( users[ 0 ].username ).to.equal( 'username2' );
        } );
    } );

    describe( 'POST /users/:username/friends/:friend', function( ) {
        beforeEach( create3Users );

        it( 'returns 403 if not logged in', async function( ) {
            const response = await request( {
                method: 'POST',
                url: apiUrl + '/users/' + 'username1' + '/friends/' + 'username3',
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 403 );
        } );

        it( 'returns 403 if not logged in as a different user', async function( ) {
            await logInAsUserNum( 2 );
            const response = await request( {
                method: 'POST',
                url: apiUrl + '/users/' + 'username1' + '/friends/' + 'username3',
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 403 );
        } );

        it( 'adds a friend', async function( ) {
            await logInAsUserNum( 1 );
            const rslt = await request( {
                method: 'POST',
                url: apiUrl + '/users/' + 'username1' + '/friends/' + 'username3',
                json: true,
                jar: true
            } );

            expect( rslt.username ).to.equal( 'username1' );
            expect( rslt.friend ).to.equal( 'username3' );
        } );

        it( 'requires the friend to exist', async function( ) {
            await logInAsUserNum( 1 );
            const response = await request( {
                method: 'POST',
                url: apiUrl + '/users/' + 'username1' + '/friends/' + 'nosuchfriend',
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 400 );
            expect( response.body.error ).to.equal( 'Data Error: Friend does not refer to a known user' );
        } );

        it( 'does not allow duplicate username-friend pairs', async function( ) {
            await logInAsUserNum( 1 );
            await request( {
                method: 'POST',
                url: apiUrl + '/users/' + 'username1' + '/friends/' + 'username3',
                json: true,
                jar: true
            } );
            const response = await request( {
                method: 'POST',
                url: apiUrl + '/users/' + 'username1' + '/friends/' + 'username3',
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );
            expect( response.statusCode ).to.equal( 400 );
            expect( response.body.error ).to.equal( 'Data Error: This Friend is already listed' );
        } );

        it( 'limits the length of friend username', async function( ) {
            await logInAsUserNum( 1 );
            const response = await request( {
                method: 'POST',
                url: apiUrl + '/users/' + 'username1' + '/friends/' + '123456789012345678901234567890',
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );
            expect( response.statusCode ).to.equal( 400 );
            expect( response.body.error ).to.equal( 'Data Error: invalid data' );
        } );
    } );

    async function create3UsersAnd3Friends() {
        await create3Users();
        await logInAsUserNum( 1 );
        await request( {
            method: 'POST',
            url: apiUrl + '/users/' + 'username1' + '/friends/' + 'username3',
            jar: true
        } );
        await logInAsUserNum( 2 );
        await request( {
            method: 'POST',
            url: apiUrl + '/users/' + 'username2' + '/friends/' + 'username1',
            jar: true
        } );
        await request( {
            method: 'POST',
            url: apiUrl + '/users/' + 'username2' + '/friends/' + 'username3',
            jar: true
        } );
        await logOut();
    }

    describe( 'GET /users/:username/friends', function( ) {
        beforeEach( create3UsersAnd3Friends );

        it( 'returns 403 if not logged in', async function( ) {
            const response = await request( {
                method: 'GET',
                url: apiUrl + '/users/' + 'username1' + '/friends/',
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 403 );
        } );

        it( 'returns 403 if not logged in as a different user', async function( ) {
            await logInAsUserNum( 2 );
            const response = await request( {
                method: 'GET',
                url: apiUrl + '/users/' + 'username1' + '/friends/',
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 403 );
        } );

        it( 'gets a list of friends of user', async function( ) {
            await logInAsUserNum( 1 );
            const friends1 = await request( {
                method: 'GET',
                url: apiUrl + '/users/' + 'username1' + '/friends/',
                json: true,
                jar: true
            } );
            await logInAsUserNum( 2 );
            const friends2 = await request( {
                method: 'GET',
                url: apiUrl + '/users/' + 'username2' + '/friends/',
                json: true,
                jar: true
            } );
            await logInAsUserNum( 3 );
            const friends3 = await request( {
                method: 'GET',
                url: apiUrl + '/users/' + 'username3' + '/friends/',
                json: true,
                jar: true
            } );

            expect( friends1.length ).to.equal( 1 );
            expect( friends2.length ).to.equal( 2 );
            expect( friends3.length ).to.equal( 0 );
            expect( friends1[ 0 ].fullName ).to.equal( 'Full Name 3' );
        } );
    } );

    describe( 'DELETE /users/:username/friends/:friend', function( ) {
        beforeEach( create3UsersAnd3Friends );

        it( 'returns 403 if not logged in', async function( ) {
            const response = await request( {
                method: 'DELETE',
                url: apiUrl + '/users/' + 'username2' + '/friends/' + 'username1',
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 403 );
        } );

        it( 'returns 403 if not logged in as a different user', async function( ) {
            await logInAsUserNum( 1 );
            const response = await request( {
                method: 'DELETE',
                url: apiUrl + '/users/' + 'username2' + '/friends/' + 'username1',
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 403 );
        } );

        it( 'removes a friend', async function( ) {
            await logInAsUserNum( 2 );
            await request( {
                method: 'DELETE',
                url: apiUrl + '/users/' + 'username2' + '/friends/' + 'username1',
                jar: true
            } );
            const friends2 = await request( {
                method: 'GET',
                url: apiUrl + '/users/' + 'username2' + '/friends/',
                json: true,
                jar: true
            } );

            expect( friends2.length ).to.equal( 1 );
        } );

        it( 'succeeds if the friend record does not exist', async function( ) {
            await logInAsUserNum( 1 );
            await request( {
                method: 'DELETE',
                url: apiUrl + '/users/' + 'username1' + '/friends/' + 'username2',
                jar: true
            } );
            const friends1 = await request( {
                method: 'GET',
                url: apiUrl + '/users/' + 'username1' + '/friends/',
                json: true,
                jar: true
            } );

            expect( friends1.length ).to.equal( 1 );
        } );
    } );

    describe( 'POST /races/', function( ) {
        beforeEach( create3Users );

        it( 'returns 403 if not logged in', async function( ) {
            const minimalData = {
                username: 'username1',
                name: 'Race Name 1',
                date: new Date( 2015, 5, 30 ),
                city: 'Sometown',
                country: 'US',
                distance: 0.5
            };
            const response = await request( {
                method: 'POST',
                url: apiUrl + '/races',
                body: minimalData,
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 403 );
        } );

        it( 'returns 403 if logged in as a different user', async function( ) {
            const minimalData = {
                username: 'username1',
                name: 'Race Name 1',
                date: new Date( 2015, 5, 30 ),
                city: 'Sometown',
                country: 'US',
                distance: 0.5
            };
            await logInAsUserNum( 2 );
            const response = await request( {
                method: 'POST',
                url: apiUrl + '/races',
                body: minimalData,
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 403 );
        } );

        it( 'adds a race to the DB', async function( ) {
            const fullData = {
                username: 'username1',
                name: 'Race Name 1',
                url: 'https://races.example.com/race1.html',
                resultsUrl: 'https://racesresults.example.com?race=race1',
                date: new Date( 2015, 5, 30 ),
                city: 'Anytown',
                state: 'WA',
                country: 'US',
                distance: 0.5,
                unit: 'marathon',
                bib: '1729',
                result: 'finished',
                chipTime: 13424,
                gunTime: 13484,
                overallPlace: 500,
                overallTotal: 1000,
                genderPlace: 50,
                genderTotal: 100,
                divisionPlace: 5,
                divisionTotal: 10,
                divisionName: 'M 60-64',
                notes: 'This was my first marathon. Nice and flat.'
            };
            await logInAsUserNum( 1 );
            const id = await request( {
                method: 'POST',
                url: apiUrl + '/races',
                body: fullData,
                json: true,
                jar: true
            } );

            expect( id ).to.be.above( 0 );
        } );

        it( 'does not require all fields', async function( ) {
            const minimalData = {
                username: 'username1',
                name: 'Race Name 1',
                date: new Date( 2015, 5, 30 ),
                city: 'Sometown',
                country: 'US',
                distance: 0.5
            };
            await logInAsUserNum( 1 );
            const id = await await request( {
                method: 'POST',
                url: apiUrl + '/races',
                body: minimalData,
                json: true,
                jar: true
            } );

            expect( id ).to.be.above( 0 );
        } );

        it( 'requires username', async function( ) {
            const badData = {
                name: 'Race Name 1',
                date: new Date( 2015, 5, 30 ),
                city: 'Sometown',
                country: 'US',
                distance: 0.5
            };
            await logInAsUserNum( 1 );
            const response = await request( {
                method: 'POST',
                url: apiUrl + '/races',
                body: badData,
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 403 );
        } );

        it( 'requires name', async function( ) {
            const badData = {
                username: 'username1',
                date: new Date( 2015, 5, 30 ),
                city: 'Sometown',
                country: 'US',
                distance: 0.5
            };
            await logInAsUserNum( 1 );
            const response = await request( {
                method: 'POST',
                url: apiUrl + '/races',
                body: badData,
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 400 );
            expect( response.body.error ).to.equal( 'Data Error: Race Name is required' );
        } );

        it( 'requires date', async function( ) {
            const badData = {
                username: 'username1',
                name: 'Race Name 1',
                city: 'Sometown',
                country: 'US',
                distance: 0.5
            };
            await logInAsUserNum( 1 );
            const response = await request( {
                method: 'POST',
                url: apiUrl + '/races',
                body: badData,
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 400 );
            expect( response.body.error ).to.equal( 'Data Error: Date is required' );
        } );

        it( 'requires city', async function( ) {
            const badData = {
                username: 'username1',
                name: 'Race Name 1',
                date: new Date( 2015, 5, 30 ),
                country: 'US',
                distance: 0.5
            };
            await logInAsUserNum( 1 );
            const response = await request( {
                method: 'POST',
                url: apiUrl + '/races',
                body: badData,
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 400 );
            expect( response.body.error ).to.equal( 'Data Error: City is required' );
        } );

        it( 'requires country', async function( ) {
            const badData = {
                username: 'username1',
                name: 'Race Name 1',
                date: new Date( 2015, 5, 30 ),
                city: 'Sometown',
                distance: 0.5
            };
            await logInAsUserNum( 1 );
            const response = await request( {
                method: 'POST',
                url: apiUrl + '/races',
                body: badData,
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 400 );
            expect( response.body.error ).to.equal( 'Data Error: Country is required' );
        } );

        it( 'requires distance', async function( ) {
            const badData = {
                username: 'username1',
                name: 'Race Name 1',
                date: new Date( 2015, 5, 30 ),
                city: 'Sometown',
                country: 'US'
            };
            await logInAsUserNum( 1 );
            const response = await request( {
                method: 'POST',
                url: apiUrl + '/races',
                body: badData,
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 400 );
            expect( response.body.error ).to.equal( 'Data Error: Distance is required' );
        } );

        it( 'requires the user to exist', async function( ) {
            const badData = {
                username: 'nosuchuser',
                name: 'Race Name 1',
                date: new Date( 2015, 5, 30 ),
                city: 'Sometown',
                country: 'US',
                distance: 0.5
            };
            await logInAsUserNum( 1 );
            const response = await request( {
                method: 'POST',
                url: apiUrl + '/races',
                body: badData,
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 403 );
        } );

        it( 'limits the length of username', async function( ) {
            const badData = {
                username: '123456789012345678901234567890',
                name: 'Race Name 1',
                date: new Date( 2015, 5, 30 ),
                city: 'Sometown',
                country: 'US',
                distance: 0.5
            };
            await logInAsUserNum( 1 );
            const response = await request( {
                method: 'POST',
                url: apiUrl + '/races',
                body: badData,
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 403 );
        } );

        it( 'limits the length of city', async function( ) {
            const badData = {
                username: 'username1',
                name: 'Race Name 1',
                date: new Date( 2015, 5, 30 ),
                city: '123456789012345678901234567890123456789012345678901',
                country: 'US',
                distance: 0.5
            };
            await logInAsUserNum( 1 );
            const response = await request( {
                method: 'POST',
                url: apiUrl + '/races',
                body: badData,
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 400 );
            expect( response.body.error ).to.equal( 'Data Error: invalid data' );
        } );

        it( 'rejects future date', async function( ) {
            const thisYear = new Date().getFullYear();
            const badData = {
                username: 'username1',
                name: 'Race Name 1',
                date: new Date( thisYear + 1, 5, 30 ),
                city: 'Sometown',
                country: 'US',
                distance: 0.5
            };
            await logInAsUserNum( 1 );
            const response = await request( {
                method: 'POST',
                url: apiUrl + '/races',
                body: badData,
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 400 );
            expect( response.body.error ).to.equal( 'Data Error: Invalid value for Date' );
        } );

        it( 'rejects negative distance', async function( ) {
            const badData = {
                username: 'username1',
                name: 'Race Name 1',
                date: new Date( 2015, 5, 30 ),
                city: 'Sometown',
                country: 'US',
                distance: -10
            };
            await logInAsUserNum( 1 );
            const response = await request( {
                method: 'POST',
                url: apiUrl + '/races',
                body: badData,
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 400 );
            expect( response.body.error ).to.equal( 'Data Error: Invalid value for Distance' );
        } );

        it( 'rejects zero distance', async function( ) {
            const badData = {
                username: 'username1',
                name: 'Race Name 1',
                date: new Date( 2015, 5, 30 ),
                city: 'Sometown',
                country: 'US',
                distance: 0
            };
            await logInAsUserNum( 1 );
            const response = await request( {
                method: 'POST',
                url: apiUrl + '/races',
                body: badData,
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 400 );
            expect( response.body.error ).to.equal( 'Data Error: Invalid value for Distance' );
        } );

        it( 'rejects invalid unit', async function( ) {
            const badData = {
                username: 'username1',
                name: 'Race Name 1',
                date: new Date( 2015, 5, 30 ),
                city: 'Sometown',
                country: 'US',
                distance: 0.5,
                unit: 'yards'
            };
            await logInAsUserNum( 1 );
            const response = await request( {
                method: 'POST',
                url: apiUrl + '/races',
                body: badData,
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 400 );
            expect( response.body.error ).to.equal( 'Data Error: Invalid value for Unit' );
        } );

        it( 'rejects invalid result', async function( ) {
            const badData = {
                username: 'username1',
                name: 'Race Name 1',
                date: new Date( 2015, 5, 30 ),
                city: 'Sometown',
                country: 'US',
                distance: 0.5,
                result: 'fail'
            };
            await logInAsUserNum( 1 );
            const response = await request( {
                method: 'POST',
                url: apiUrl + '/races',
                body: badData,
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 400 );
            expect( response.body.error ).to.equal( 'Data Error: Invalid value for Result' );
        } );

        it( 'rejects negative chip time', async function( ) {
            const badData = {
                username: 'username1',
                name: 'Race Name 1',
                date: new Date( 2015, 5, 30 ),
                city: 'Sometown',
                country: 'US',
                distance: 0.5,
                chipTime: -3600
            };
            await logInAsUserNum( 1 );
            const response = await request( {
                method: 'POST',
                url: apiUrl + '/races',
                body: badData,
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 400 );
            expect( response.body.error ).to.equal( 'Data Error: Invalid value for Chip Time' );
        } );

        it( 'rejects negative gun time', async function( ) {
            const badData = {
                username: 'username1',
                name: 'Race Name 1',
                date: new Date( 2015, 5, 30 ),
                city: 'Sometown',
                country: 'US',
                distance: 0.5,
                gunTime: -600
            };
            await logInAsUserNum( 1 );
            const response = await request( {
                method: 'POST',
                url: apiUrl + '/races',
                body: badData,
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 400 );
            expect( response.body.error ).to.equal( 'Data Error: Invalid value for Gun Time' );
        } );

        it( 'rejects negative overall place', async function( ) {
            const badData = {
                username: 'username1',
                name: 'Race Name 1',
                date: new Date( 2015, 5, 30 ),
                city: 'Sometown',
                country: 'US',
                distance: 0.5,
                overallPlace: -6
            };
            await logInAsUserNum( 1 );
            const response = await request( {
                method: 'POST',
                url: apiUrl + '/races',
                body: badData,
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 400 );
            expect( response.body.error ).to.equal( 'Data Error: Invalid value for Overall Place' );
        } );

        it( 'rejects overall place > total', async function( ) {
            const badData = {
                username: 'username1',
                name: 'Race Name 1',
                date: new Date( 2015, 5, 30 ),
                city: 'Sometown',
                country: 'US',
                distance: 0.5,
                overallPlace: 500,
                overallTotal: 100
            };
            await logInAsUserNum( 1 );
            const response = await request( {
                method: 'POST',
                url: apiUrl + '/races',
                body: badData,
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 400 );
            expect( response.body.error ).to.equal( 'Data Error: Invalid value for Overall Place' );
        } );

        it( 'rejects zero gender place', async function( ) {
            const badData = {
                username: 'username1',
                name: 'Race Name 1',
                date: new Date( 2015, 5, 30 ),
                city: 'Sometown',
                country: 'US',
                distance: 0.5,
                genderPlace: 0
            };
            await logInAsUserNum( 1 );
            const response = await request( {
                method: 'POST',
                url: apiUrl + '/races',
                body: badData,
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 400 );
            expect( response.body.error ).to.equal( 'Data Error: Invalid value for Gender Place' );
        } );

        it( 'rejects gender place > total', async function( ) {
            const badData = {
                username: 'username1',
                name: 'Race Name 1',
                date: new Date( 2015, 5, 30 ),
                city: 'Sometown',
                country: 'US',
                distance: 0.5,
                genderPlace: 50,
                genderTotal: 10
            };
            await logInAsUserNum( 1 );
            const response = await request( {
                method: 'POST',
                url: apiUrl + '/races',
                body: badData,
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 400 );
            expect( response.body.error ).to.equal( 'Data Error: Invalid value for Gender Place' );
        } );

        it( 'rejects negative division place', async function( ) {
            const badData = {
                username: 'username1',
                name: 'Race Name 1',
                date: new Date( 2015, 5, 30 ),
                city: 'Sometown',
                country: 'US',
                distance: 0.5,
                divisionPlace: -6
            };
            await logInAsUserNum( 1 );
            const response = await request( {
                method: 'POST',
                url: apiUrl + '/races',
                body: badData,
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 400 );
            expect( response.body.error ).to.equal( 'Data Error: Invalid value for Division Place' );
        } );

        it( 'rejects division place > total', async function( ) {
            const badData = {
                username: 'username1',
                name: 'Race Name 1',
                date: new Date( 2015, 5, 30 ),
                city: 'Sometown',
                country: 'US',
                distance: 0.5,
                divisionPlace: 50,
                divisionTotal: 10
            };
            await logInAsUserNum( 1 );
            const response = await request( {
                method: 'POST',
                url: apiUrl + '/races',
                body: badData,
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 400 );
            expect( response.body.error ).to.equal( 'Data Error: Invalid value for Division Place' );
        } );
    } );

    async function create3UsersAnd3Races() {
        await create3Users();
        await logInAsUserNum( 1 );
        const data1 = {
            username: 'username1',
            name: 'Race Name 1',
            url: 'https://races.example.com/race1.html',
            resultsUrl: 'https://racesresults.example.com?race=race1',
            date: new Date( 2015, 5, 30 ),
            city: 'Anytown',
            state: 'WA',
            country: 'US',
            distance: 1,
            unit: 'marathon',
            bib: '1729',
            result: 'finished',
            chipTime: 13424,
            gunTime: 13484,
            overallPlace: 500,
            overallTotal: 1000,
            genderPlace: 50,
            genderTotal: 100,
            divisionPlace: 5,
            divisionTotal: 10,
            divisionName: 'M 60-64',
            notes: 'This was my first marathon. Nice and flat.'
        };
        const raceId1 = await request( {
            method: 'POST',
            url: apiUrl + '/races',
            body: data1,
            json: true,
            jar: true
        } );
        await logInAsUserNum( 2 );
        const data2 = {
            username: 'username2',
            name: 'Race Name 2',
            date: new Date( 2016, 3, 5 ),
            city: 'Sometown',
            country: 'US',
            distance: 0.5,
            unit: 'marathon'
        };
        const raceId2 = await request( {
            method: 'POST',
            url: apiUrl + '/races',
            body: data2,
            json: true,
            jar: true
        } );
        await logInAsUserNum( 1 );
        const data3 = {
            username: 'username1',
            name: 'Race Name 3',
            date: new Date( 2018, 7, 14 ),
            city: 'Mytown',
            state: 'OR',
            country: 'US',
            distance: 5
        };
        const raceId3 = await request( {
            method: 'POST',
            url: apiUrl + '/races',
            body: data3,
            json: true,
            jar: true
        } );
        await logOut();

        return [ raceId1, raceId2, raceId3 ];
    }

    describe( 'GET /users/:username/races/', function( ) {
        beforeEach( create3UsersAnd3Races );

        it( "gets a user's races", async function( ) { //eslint-disable-line quotes
            const races1 = await request( {
                method: 'GET',
                url: apiUrl + '/users/' + 'username1' + '/races',
                json: true,
                jar: true
            } );
            const races2 = await request( {
                method: 'GET',
                url: apiUrl + '/users/' + 'username2' + '/races',
                json: true,
                jar: true
            } );
            const races3 = await request( {
                method: 'GET',
                url: apiUrl + '/users/' + 'username3' + '/races',
                json: true,
                jar: true
            } );
            const races4 = await request( {
                method: 'GET',
                url: apiUrl + '/users/' + 'nosuchuser' + '/races',
                json: true,
                jar: true
            } );

            expect( races1.length ).to.equal( 2 );
            expect( races2.length ).to.equal( 1 );
            expect( races3.length ).to.equal( 0 );
            expect( races4.length ).to.equal( 0 );
            expect( races1[ 1 ].state ).to.equal( 'OR' );
            expect( races2[ 0 ].date ).to.equal( new Date( 2016, 3, 5 ).toJSON() );
        } );
    } );

    describe( 'GET /races/:id', function( ) {
        let raceId1, raceId3;
        beforeEach( async function( ) {
            const ids = await create3UsersAnd3Races();
            raceId1 = ids[ 0 ];
            raceId3 = ids[ 2 ];
        } );

        it( 'returns 403 if not logged in', async function( ) {
            const response = await request( {
                method: 'GET',
                url: apiUrl + '/races/' + raceId1,
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 403 );
        } );

        it( 'gets a race by ID', async function( ) {
            await logInAsUserNum( 1 );
            const race1 = await request( {
                method: 'GET',
                url: apiUrl + '/races/' + raceId1,
                json: true,
                jar: true
            } );
            const race3 = await request( {
                method: 'GET',
                url: apiUrl + '/races/' + raceId3,
                json: true,
                jar: true
            } );

            expect( race1.genderPlace ).to.equal( 50 );
            expect( race3.city ).to.equal( 'Mytown' );
        } );

        it( 'returns 403 if not logged in as a different user', async function( ) {
            await logInAsUserNum( 2 );
            const response = await request( {
                method: 'GET',
                url: apiUrl + '/races/' + raceId1,
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 403 );
        } );

        it( 'returns 404 for non-existent race', async function( ) {
            await logInAsUserNum( 1 );
            const response = await request( {
                method: 'GET',
                url: apiUrl + '/races/' + -10,
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 404 );
        } );
    } );

    describe( 'PUT /races/:id', function( ) {
        let raceId1, raceId2;
        beforeEach( async function( ) {
            const ids = await create3UsersAnd3Races();
            raceId1 = ids[ 0 ];
            raceId2 = ids[ 1 ];
        } );

        it( 'returns 403 if not logged in', async function( ) {
            const newData = {
                name: 'New Race Name',
                city: 'Oaktown',
                country: 'US',
                unit: 'km'
            };

            const response = await request( {
                method: 'PUT',
                url: apiUrl + '/races/' + raceId1,
                body: newData,
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 403 );
        } );

        it( 'returns 403 if logged in as a different user', async function( ) {
            const newData = {
                name: 'New Race Name',
                city: 'Oaktown',
                country: 'US',
                unit: 'km'
            };

            await logInAsUserNum( 2 );
            const response = await request( {
                method: 'PUT',
                url: apiUrl + '/races/' + raceId1,
                body: newData,
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 403 );
        } );

        it( 'updates most fields', async function( ) {
            const newData = {
                name: 'New Race Name',
                url: 'https://races.example.com/newrace.html',
                resultsUrl: 'https://racesresults.example.com?race=newrace',
                date: new Date( 2015, 8, 29 ),
                city: 'Oaktown',
                state: 'CA',
                country: 'US',
                distance: 10,
                unit: 'km',
                bib: '2525',
                result: 'disqualified',
                chipTime: 2858,
                gunTime: 2868,
                overallPlace: 100,
                overallTotal: 500,
                genderPlace: 10,
                genderTotal: 50,
                divisionPlace: 1,
                divisionTotal: 5,
                divisionName: 'M 60-69',
                notes: 'PR'
            };

            await logInAsUserNum( 1 );
            await request( {
                method: 'PUT',
                url: apiUrl + '/races/' + raceId1,
                body: newData,
                json: true,
                jar: true
            } );
            await logInAsUserNum( 2 );
            await request( {
                method: 'PUT',
                url: apiUrl + '/races/' + raceId2,
                body: newData,
                json: true,
                jar: true
            } );
            await logInAsUserNum( 1 );
            const race1 = await request( {
                method: 'GET',
                url: apiUrl + '/races/' + raceId1,
                json: true,
                jar: true
            } );
            await logInAsUserNum( 2 );
            const race2 = await request( {
                method: 'GET',
                url: apiUrl + '/races/' + raceId2,
                json: true,
                jar: true
            } );

            expect( race1.name ).to.equal( newData.name );
            expect( race2.url ).to.equal( newData.url );
            expect( race1.resultsUrl ).to.equal( newData.resultsUrl );
            expect( race2.date ).to.equal( newData.date.toJSON() );
            expect( race1.city ).to.equal( newData.city );
            expect( race2.state ).to.equal( newData.state );
            expect( race1.country ).to.equal( newData.country );
            expect( race2.distance ).to.equal( newData.distance );
            expect( race1.unit ).to.equal( newData.unit );
            expect( race2.bib ).to.equal( newData.bib );
            expect( race1.result ).to.equal( newData.result );
            expect( race2.chipTime ).to.equal( newData.chipTime );
            expect( race1.gunTime ).to.equal( newData.gunTime );
            expect( race2.overallPlace ).to.equal( newData.overallPlace );
            expect( race1.overallTotal ).to.equal( newData.overallTotal );
            expect( race2.genderPlace ).to.equal( newData.genderPlace );
            expect( race1.genderTotal ).to.equal( newData.genderTotal );
            expect( race2.divisionPlace ).to.equal( newData.divisionPlace );
            expect( race1.divisionTotal ).to.equal( newData.divisionTotal );
            expect( race2.divisionName ).to.equal( newData.divisionName );
            expect( race1.notes ).to.equal( newData.notes );
        } );

        it( 'can update just some fields', async function( ) {
            const newData = {
                name: 'New Race Name',
                resultsUrl: 'https://racesresults.example.com?race=newrace',
                city: 'Oaktown',
                country: 'US',
                unit: 'km',
                result: 'disqualified',
                gunTime: 2868,
                overallTotal: 500,
                genderTotal: 50,
                divisionTotal: 5,
                notes: 'PR'
            };

            await logInAsUserNum( 1 );
            await request( {
                method: 'PUT',
                url: apiUrl + '/races/' + raceId1,
                body: newData,
                json: true,
                jar: true
            } );
            await logInAsUserNum( 1 );
            const race1 = await request( {
                method: 'GET',
                url: apiUrl + '/races/' + raceId1,
                json: true,
                jar: true
            } );

            expect( race1.name ).to.equal( newData.name );
            expect( race1.resultsUrl ).to.equal( newData.resultsUrl );
            expect( race1.city ).to.equal( newData.city );
            expect( race1.country ).to.equal( newData.country );
            expect( race1.unit ).to.equal( newData.unit );
            expect( race1.result ).to.equal( newData.result );
            expect( race1.gunTime ).to.equal( newData.gunTime );
            expect( race1.overallTotal ).to.equal( newData.overallTotal );
            expect( race1.genderTotal ).to.equal( newData.genderTotal );
            expect( race1.divisionTotal ).to.equal( newData.divisionTotal );
            expect( race1.notes ).to.equal( newData.notes );
        } );

        it( 'does not change username', async function( ) {
            const newData = {
                username: 'newusername1'
            };
            await logInAsUserNum( 1 );
            await request( {
                method: 'PUT',
                url: apiUrl + '/races/' + raceId1,
                body: newData,
                json: true,
                jar: true
            } );
            const race1 = await request( {
                method: 'GET',
                url: apiUrl + '/races/' + raceId1,
                json: true,
                jar: true
            } );

            expect( race1.username ).to.equal( 'username1' );
        } );

        it( 'does not affect other races', async function( ) {
            const newData = {
                name: 'New Race Name',
                resultsUrl: 'https://racesresults.example.com?race=newrace',
                city: 'Oaktown',
                country: 'US',
                unit: 'km',
                result: 'disqualified',
                gunTime: 2868,
                overallTotal: 500,
                genderTotal: 50,
                divisionTotal: 5,
                notes: 'Just updating some fields'
            };

            await logInAsUserNum( 1 );
            await dbService.updateRace( raceId1, newData );
            await logInAsUserNum( 2 );
            const race2 = await request( {
                method: 'GET',
                url: apiUrl + '/races/' + raceId2,
                json: true,
                jar: true
            } );

            expect( race2.name ).to.equal( 'Race Name 2' );
        } );
    } );

    describe( 'DELETE /races/:id', function( ) {
        let raceId1;
        beforeEach( async function( ) {
            const ids = await create3UsersAnd3Races();
            raceId1 = ids[ 0 ];
        } );

        it( 'returns 403 if not logged in', async function( ) {
            const response = await request( {
                method: 'DELETE',
                url: apiUrl + '/races/' + raceId1,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 403 );
        } );

        it( 'returns 403 if logged in as a different user', async function( ) {
            await logInAsUserNum( 2 );
            const response = await request( {
                method: 'DELETE',
                url: apiUrl + '/races/' + raceId1,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 403 );
        } );

        it( 'removes a race from the DB', async function( ) {
            await logInAsUserNum( 1 );
            await request( {
                method: 'DELETE',
                url: apiUrl + '/races/' + raceId1,
                jar: true
            } );
            const races1 = await request( {
                method: 'GET',
                url: apiUrl + '/users/' + 'username1' + '/races',
                json: true,
                jar: true
            } );

            expect( races1.length ).to.equal( 1 );
            expect( races1[ 0 ].name ).to.equal( 'Race Name 3' );
        } );

        it( 'succeeds if the race already does not exist', async function( ) {
            await request( {
                method: 'DELETE',
                url: apiUrl + '/races/' + -10,
                jar: true
            } );
            const races1 = await request( {
                method: 'GET',
                url: apiUrl + '/users/' + 'username1' + '/races',
                json: true,
                jar: true
            } );

            expect( races1.length ).to.equal( 2 );
        } );
    } );
} );