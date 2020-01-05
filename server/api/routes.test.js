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


    async function createUsers( n ) {
        let userData = {
            username: 'username1',
            fullName: 'Full Name 1',
            gender: 'male',
            dateOfBirth: new Date( 1969, 6, 20 ),
            email: 'username1@example.com',
            visibility: 'public',
            password: 'secret1'
        };
        await request( {
            method: 'POST',
            url: apiUrl + '/users',
            body: userData,
            json: true
        } );

        for ( let i = 2; i <= n; ++i ) {
            let userData = {
                username: 'username' + i,
                fullName: 'Full Name ' + i,
                password: 'secret' + i
            };
            switch ( i % 4 ) {
                case 0: {
                    userData.visibility = 'public';
                    break;
                }
                case 1: {
                    userData.visibility = 'users';
                    break;
                }
                case 2: {
                    userData.visibility = 'friends';
                    break;
                }
                case 3: {
                    userData.visibility = 'private';
                    break;
                }
            }
            await request( {
                method: 'POST',
                url: apiUrl + '/users',
                body: userData,
                json: true
            } );
        }
    }

    async function create3Users() {
        await createUsers( 3 );
    }

    async function createUsersAndFriends( n ) {
        await createUsers( n );
        for ( let i = 1; i <= n; ++i ) {
            if ( i % 8 === 2 ) {
                await logInAsUserNum( i );
                for ( let j = 1; j <= n; ++j ) {
                    if ( j % 2 === 1 ) {
                        await request( {
                            method: 'POST',
                            url: apiUrl + '/users/' + 'username' + i + '/friends/' + 'username' + j,
                            jar: true
                        } );
                    }
                }
            }
            if ( i % 8 === 6 ) {
                await logInAsUserNum( i );
                for ( let j = 1; j <= n; ++j ) {
                    if ( ( j % 2 === 0 ) && ( i !== j ) ) {
                        await request( {
                            method: 'POST',
                            url: apiUrl + '/users/' + 'username' + i + '/friends/' + 'username' + j,
                            jar: true
                        } );
                    }
                }
            }
        }
        await logOut( );
    }

    async function create9UsersAndFriends() {
        /*
            Creates usernameN with visibility:
            1 public
            2 friends (1,3,5,7,9)
            3 private
            4 public
            5 users
            6 friends (2,4,8)
            7 private
            8 public
            9 users
        */
        await createUsersAndFriends( 9 );
    }

    async function createUsersFriendsAndRaces( n ) {
        await createUsersAndFriends( n );
        let raceIds = [];

        await logInAsUserNum( 1 );
        const raceData1 = {
            username: 'username1',
            name: 'Race Name 1',
            url: 'https://races.example.com/race1.html',
            resultsUrl: 'https://racesresults.example.com?race=race1',
            date: new Date( 2015, 5, 30 ),
            city: 'Anytown',
            state: 'WA',
            country: 'US',
            bib: '1729',
            scoring: 'individual',
            legs: [
                {
                    distance: 0.5,
                    unit: 'marathon',
                    sport: 'running',
                    terrain: 'trail',
                    chipTime: 13424,
                    gunTime: 13484
                }
            ],
            result: 'finished',
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
            body: raceData1,
            json: true,
            jar: true
        } );
        raceIds.push( raceId1 );

        let r = 1;
        for ( let u = 1; u <= n; ++u ) {
            await logInAsUserNum( u );
            for ( let i = 0; i < (u % 4); ++i, ++r ) {
                const raceData = {
                    username: 'username' + u,
                    name: 'Race Name ' + r,
                    date: new Date( 2000 + r, (r % 12) + 1, 1 ),
                    city: 'City ' + r,
                    country: 'Country ' + r,
                    legs: [ {
                        distance: 10 + r
                    } ]
                };
                const raceId = await request( {
                    method: 'POST',
                    url: apiUrl + '/races',
                    body: raceData,
                    json: true,
                    jar: true
                } );
                raceIds.push( raceId );
            }
        }
        await logOut( );

        return raceIds;
    }

    async function create9UsersFriendsAndRaces( ) {
        /*
            Creates usernameN with visibility and races 'Race Name R':
            1: public         0,1
            2: friends (odd)  2,3
            3: private        4,5,6
            4: public
            5: users          7
            6: friends (even) 8,9
            7: private        10,11,12
            8: public
            9: users          13
        */
        return await createUsersFriendsAndRaces( 9 );
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
                    visibility: 'public',
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

        it( 'accepts empty optional fields', async function() {
            const response = await request( {
                method: 'POST',
                url: apiUrl + '/users',
                body: {
                    username: 'username1',
                    fullName: 'Full Name 1',
                    gender: '',
                    dateOfBirth: '',
                    email: '',
                    password: 'secret1'
                },
                json: true,
                resolveWithFullResponse: true,
                simple: false
            } );
            expect( response.statusCode ).to.equal( 201 );
            expect( response.body ).to.equal( 'username1' );
            expect( response.body.error ).to.be.undefined;
        } );
    } );

    describe( 'GET /users', function( ) {
        beforeEach( create9UsersAndFriends );

        it( 'gets only public users if not logged in', async function( ) {
            const users = await request( {
                method: 'GET',
                url: apiUrl + '/users',
                json: true,
                jar: true
            } );

            expect( users.length ).to.equal( 3 );
            expect( users[ 0 ].fullName ).to.equal( 'Full Name 1' ); //public
            expect( users[ 1 ].fullName ).to.equal( 'Full Name 4' ); //public
            expect( users[ 2 ].fullName ).to.equal( 'Full Name 8' ); //public
        } );

        it( 'gets the correctly visibile users when logged in (5)', async function( ) {
            await logInAsUserNum( 5 );
            const users = await request( {
                method: 'GET',
                url: apiUrl + '/users',
                json: true,
                jar: true
            } );

            expect( users.length ).to.equal( 6 );
            expect( users[ 0 ].fullName ).to.equal( 'Full Name 1' ); //public
            expect( users[ 1 ].fullName ).to.equal( 'Full Name 2' ); //friends
            expect( users[ 2 ].fullName ).to.equal( 'Full Name 4' ); //public
            expect( users[ 3 ].fullName ).to.equal( 'Full Name 5' ); //self
            expect( users[ 4 ].fullName ).to.equal( 'Full Name 8' ); //public
            expect( users[ 5 ].fullName ).to.equal( 'Full Name 9' ); //users
        } );

        it( 'gets the correctly visibile users when logged in (6)', async function() {
            await logInAsUserNum( 6 );
            const users = await request( {
                method: 'GET',
                url: apiUrl + '/users',
                json: true,
                jar: true
            } );

            expect( users.length ).to.equal( 6 );
            expect( users[ 0 ].fullName ).to.equal( 'Full Name 1' ); //public
            expect( users[ 1 ].fullName ).to.equal( 'Full Name 4' ); //public
            expect( users[ 2 ].fullName ).to.equal( 'Full Name 5' ); //users
            expect( users[ 3 ].fullName ).to.equal( 'Full Name 6' ); //self
            expect( users[ 4 ].fullName ).to.equal( 'Full Name 8' ); //public
            expect( users[ 5 ].fullName ).to.equal( 'Full Name 9' ); //users
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

        it( 'returns 403 if logged in as a different user', async function( ) {
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

    describe( 'DELETE /users/:username', function( ) {
        beforeEach( create9UsersAndFriends );

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

        it( 'returns 403 if logged in as a different user', async function( ) {
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

            expect( users.length ).to.equal( 6 );
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

        it( 'returns 403 if logged in as a different user', async function( ) {
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

    describe( 'GET /users/:username/friends', function( ) {
        beforeEach( create9UsersAndFriends );

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
            await logInAsUserNum( 6 );
            const friends6 = await request( {
                method: 'GET',
                url: apiUrl + '/users/' + 'username6' + '/friends/',
                json: true,
                jar: true
            } );

            expect( friends1.length ).to.equal( 0 );
            expect( friends2.length ).to.equal( 5 );
            expect( friends6.length ).to.equal( 3 );
            expect( friends6[ 0 ].fullName ).to.equal( 'Full Name 2' );
        } );
    } );

    describe( 'DELETE /users/:username/friends/:friend', function( ) {
        beforeEach( create9UsersAndFriends );

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

            expect( friends2.length ).to.equal( 4 );
        } );

        it( 'succeeds if the friend record does not exist', async function( ) {
            await logInAsUserNum( 2 );
            await request( {
                method: 'DELETE',
                url: apiUrl + '/users/' + 'username2' + '/friends/' + 'username4',
                jar: true
            } );
            const friends2 = await request( {
                method: 'GET',
                url: apiUrl + '/users/' + 'username2' + '/friends/',
                json: true,
                jar: true
            } );

            expect( friends2.length ).to.equal( 5 );
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
                legs: [ {
                    distance: 5
                } ]
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
                legs: [ {
                    distance: 5
                } ]
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
                bib: '1729',
                scoring: 'individual',
                legs: [
                    {
                        distance: 0.5,
                        unit: 'marathon',
                        sport: 'running',
                        terrain: 'trail',
                        chipTime: 13424,
                        gunTime: 13484
                    }
                ],
                result: 'finished',
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
                legs: [ {
                    distance: 5
                } ]
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

        it( 'ignores extra fields', async function() {
            const minimalData = {
                username: 'username1',
                name: 'Race Name 1',
                date: new Date( 2015, 5, 30 ),
                city: 'Sometown',
                country: 'US',
                legs: [ {
                    distance: 5
                } ],
                foo: 'foo val',
                distance: 5
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
                legs: [ {
                    distance: 5
                } ]
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
                legs: [ {
                    distance: 5
                } ]
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
                legs: [ {
                    distance: 5
                } ]
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
                legs: [ {
                    distance: 5
                } ]
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
                legs: [ {
                    distance: 5
                } ]
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

        it( 'requires legs', async function() {
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
            expect( response.body.error ).to.equal( 'Data Error: At least one leg is required' );
        } );

        it( 'requires at least one leg', async function() {
            const badData = {
                username: 'username1',
                name: 'Race Name 1',
                date: new Date( 2015, 5, 30 ),
                city: 'Sometown',
                country: 'US',
                legs: []
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
            expect( response.body.error ).to.equal( 'Data Error: At least one leg is required' );
        } );

        it( 'requires distance', async function( ) {
            const badData = {
                username: 'username1',
                name: 'Race Name 1',
                date: new Date( 2015, 5, 30 ),
                city: 'Sometown',
                country: 'US',
                legs: [ {
                } ]
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
                legs: [ {
                    distance: 5
                } ]
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
                legs: [ {
                    distance: 5
                } ]
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
                legs: [ {
                    distance: 5
                } ]
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
                legs: [ {
                    distance: 5
                } ]
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
                legs: [ {
                    distance: -10
                } ]
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
                legs: [ {
                    distance: 0
                } ]
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
                legs: [ {
                    distance: 880,
                    unit: 'yards'
                } ]
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

        it( 'rejects negative chip time', async function( ) {
            const badData = {
                username: 'username1',
                name: 'Race Name 1',
                date: new Date( 2015, 5, 30 ),
                city: 'Sometown',
                country: 'US',
                legs: [ {
                    distance: 5,
                    chipTime: -3600
                } ]
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
                legs: [ {
                    distance: 5,
                    gunTime: -600
                } ]
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

        it( 'rejects invalid result', async function() {
            const badData = {
                username: 'username1',
                name: 'Race Name 1',
                date: new Date( 2015, 5, 30 ),
                city: 'Sometown',
                country: 'US',
                legs: [ {
                    distance: 5
                } ],
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

        it( 'rejects negative overall place', async function( ) {
            const badData = {
                username: 'username1',
                name: 'Race Name 1',
                date: new Date( 2015, 5, 30 ),
                city: 'Sometown',
                country: 'US',
                legs: [ {
                    distance: 5
                } ],
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
                legs: [ {
                    distance: 5
                } ],
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
                legs: [ {
                    distance: 5
                } ],
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
                legs: [ {
                    distance: 5
                } ],
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
                legs: [ {
                    distance: 5
                } ],
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
                legs: [ {
                    distance: 5
                } ],
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

    describe( 'GET /users/:username/races/', function( ) {
        beforeEach( create9UsersFriendsAndRaces );

        it( "gets a public user's races if not logged in", async function() { //eslint-disable-line quotes
            const races1 = await request( {
                method: 'GET',
                url: apiUrl + '/users/' + 'username1' + '/races',
                json: true,
                jar: true
            } );

            expect( races1.length ).to.equal( 2 );
            expect( races1[ 1 ].date ).to.equal( new Date( 2015, 5, 30 ).toJSON() );
            expect( races1[ 0 ].name ).to.equal( 'Race Name 1' );
        } );

        it( 'returns 403 if user is not public and not logged in', async function( ) {
            const response = await request( {
                method: 'GET',
                url: apiUrl + '/users/' + 'username2' + '/races',
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 403 );
        } );

        it( "gets a visible user's races", async function() { //eslint-disable-line quotes
            await logInAsUserNum( 2 );
            const races6 = await request( {
                method: 'GET',
                url: apiUrl + '/users/' + 'username6' + '/races',
                json: true,
                jar: true
            } );
            await logInAsUserNum( 7 );
            const races7 = await request( {
                method: 'GET',
                url: apiUrl + '/users/' + 'username7' + '/races',
                json: true,
                jar: true
            } );

            expect( races6.length ).to.equal( 2 );
            expect( races6[ 1 ].name ).to.equal( 'Race Name 9' );
            expect( races7.length ).to.equal( 3 );
            expect( races7[ 2 ].name ).to.equal( 'Race Name 12' );
        } );

        it( 'returns 403 if user is not visible to logged-in user', async function() {
            await logInAsUserNum( 2 );
            const response = await request( {
                method: 'GET',
                url: apiUrl + '/users/' + 'username7' + '/races',
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 403 );
        } );
    } );

    describe( 'GET /races/:id', function( ) {
        let raceIds;
        beforeEach( async function( ) {
            raceIds = await create9UsersFriendsAndRaces( );
        } );

        it( 'returns 403 if not logged in', async function( ) {
            const response = await request( {
                method: 'GET',
                url: apiUrl + '/races/' + raceIds[0],
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 403 );
        } );

        it( 'gets a race by ID', async function( ) {
            await logInAsUserNum( 1 );
            const race0 = await request( {
                method: 'GET',
                url: apiUrl + '/races/' + raceIds[0],
                json: true,
                jar: true
            } );
            const race1 = await request( {
                method: 'GET',
                url: apiUrl + '/races/' + raceIds[1],
                json: true,
                jar: true
            } );

            expect( race0.genderPlace ).to.equal( 50 );
            expect( race1.country ).to.equal( 'Country 1' );
        } );

        it( 'returns 403 if not logged in as a different user', async function( ) {
            await logInAsUserNum( 2 );
            const response = await request( {
                method: 'GET',
                url: apiUrl + '/races/' + raceIds[1],
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
                url: apiUrl + '/races/' + -99,
                json: true,
                jar: true,
                resolveWithFullResponse: true,
                simple: false
            } );

            expect( response.statusCode ).to.equal( 404 );
        } );
    } );

    describe( 'PUT /races/:id', function( ) {
        let raceIds;
        beforeEach( async function( ) {
            raceIds = await create9UsersFriendsAndRaces( );
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
                url: apiUrl + '/races/' + raceIds[0],
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
                url: apiUrl + '/races/' + raceIds[0],
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
                bib: '2525',
                scoring: 'relay',
                legs: [
                    {
                        distance: 10,
                        unit: 'km',
                        chipTime: 2858,
                        gunTime: 2868
                    },
                    {
                        distance: 20,
                        unit: 'mi',
                        sport: 'cycling',
                        terrain: 'trail'
                    }
                ],
                result: 'disqualified',
                overallPlace: 100,
                overallTotal: 500,
                genderPlace: 10,
                genderTotal: 50,
                divisionPlace: 1,
                divisionTotal: 5,
                divisionName: 'M 60-69',
                notes: 'Missed a turn.'
            };

            await logInAsUserNum( 1 );
            await request( {
                method: 'PUT',
                url: apiUrl + '/races/' + raceIds[0],
                body: newData,
                json: true,
                jar: true
            } );
            await logInAsUserNum( 2 );
            await request( {
                method: 'PUT',
                url: apiUrl + '/races/' + raceIds[2],
                body: newData,
                json: true,
                jar: true
            } );
            await logInAsUserNum( 1 );
            const race0 = await request( {
                method: 'GET',
                url: apiUrl + '/races/' + raceIds[0],
                json: true,
                jar: true
            } );
            await logInAsUserNum( 2 );
            const race2 = await request( {
                method: 'GET',
                url: apiUrl + '/races/' + raceIds[2],
                json: true,
                jar: true
            } );

            expect( race0.name ).to.equal( newData.name );
            expect( race2.url ).to.equal( newData.url );
            expect( race0.resultsUrl ).to.equal( newData.resultsUrl );
            expect( race2.date ).to.equal( newData.date.toJSON() );
            expect( race0.city ).to.equal( newData.city );
            expect( race2.state ).to.equal( newData.state );
            expect( race0.country ).to.equal( newData.country );
            expect( race2.bib ).to.equal( newData.bib );
            expect( race0.scoring ).to.equal( newData.scoring );
            expect( race2.legs.length ).to.equal( newData.legs.length );
            expect( race0.legs[ 0 ].distance ).to.equal( newData.legs[ 0 ].distance );
            expect( race2.legs[ 1 ].unit ).to.equal( newData.legs[ 1 ].unit );
            expect( race0.legs[ 1 ].sport ).to.equal( newData.legs[ 1 ].sport );
            expect( race2.legs[ 1 ].terrain ).to.equal( newData.legs[ 1 ].terrain );
            expect( race0.legs[ 0 ].chipTime ).to.equal( newData.legs[ 0 ].chipTime );
            expect( race2.legs[ 0 ].gunTime ).to.equal( newData.legs[ 0 ].gunTime );
            expect( race0.result ).to.equal( newData.result );
            expect( race2.overallPlace ).to.equal( newData.overallPlace );
            expect( race0.overallTotal ).to.equal( newData.overallTotal );
            expect( race2.genderPlace ).to.equal( newData.genderPlace );
            expect( race0.genderTotal ).to.equal( newData.genderTotal );
            expect( race2.divisionPlace ).to.equal( newData.divisionPlace );
            expect( race0.divisionTotal ).to.equal( newData.divisionTotal );
            expect( race2.divisionName ).to.equal( newData.divisionName );
            expect( race0.notes ).to.equal( newData.notes );
        } );

        it( 'can update just some fields', async function( ) {
            const newData = {
                name: 'New Race Name',
                resultsUrl: 'https://racesresults.example.com?race=newrace',
                city: 'Oaktown',
                country: 'US',
                legs: [
                    {
                        distance: 10,
                        unit: 'km',
                        chipTime: 2858,
                    },
                    {
                        distance: 20,
                        unit: 'mi',
                        sport: 'cycling',
                        terrain: 'trail'
                    }
                ],
                result: 'disqualified',
                overallTotal: 500,
                genderPlace: 10,
                divisionName: 'M 60-69',
                notes: 'Missed a turn.'
            };

            await logInAsUserNum( 1 );
            await request( {
                method: 'PUT',
                url: apiUrl + '/races/' + raceIds[0],
                body: newData,
                json: true,
                jar: true
            } );
            await logInAsUserNum( 1 );
            const race0 = await request( {
                method: 'GET',
                url: apiUrl + '/races/' + raceIds[0],
                json: true,
                jar: true
            } );

            expect( race0.name ).to.equal( newData.name );
            expect( race0.url ).to.equal( 'https://races.example.com/race1.html' );
            expect( race0.resultsUrl ).to.equal( newData.resultsUrl );
            expect( race0.date.valueOf() ).to.equal( ( new Date( 2015, 5, 30 ) ).toJSON() );
            expect( race0.city ).to.equal( newData.city );
            expect( race0.state ).to.equal( 'WA' );
            expect( race0.country ).to.equal( newData.country );
            expect( race0.bib ).to.equal( '1729' );
            expect( race0.scoring ).to.equal( 'individual' );
            expect( race0.legs.length ).to.equal( newData.legs.length );
            expect( race0.legs[ 0 ].distance ).to.equal( newData.legs[ 0 ].distance );
            expect( race0.legs[ 0 ].unit ).to.equal( newData.legs[ 0 ].unit );
            expect( race0.legs[ 1 ].sport ).to.equal( newData.legs[ 1 ].sport );
            expect( race0.legs[ 0 ].terrain ).to.equal( 'road' );
            expect( race0.legs[ 1 ].terrain ).to.equal( newData.legs[ 1 ].terrain );
            expect( race0.legs[ 0 ].chipTime ).to.equal( newData.legs[ 0 ].chipTime );
            expect( race0.legs[ 0 ].gunTime ).to.be.null;
            expect( race0.result ).to.equal( newData.result );
            expect( race0.overallPlace ).to.equal( 500 );
            expect( race0.overallTotal ).to.equal( newData.overallTotal );
            expect( race0.genderPlace ).to.equal( newData.genderPlace );
            expect( race0.genderTotal ).to.equal( 100 );
            expect( race0.divisionPlace ).to.equal( 5 );
            expect( race0.divisionTotal ).to.equal( 10 );
            expect( race0.divisionName ).to.equal( newData.divisionName );
            expect( race0.notes ).to.equal( newData.notes );
        } );

        it( 'does not change username', async function( ) {
            const newData = {
                username: 'newusername1'
            };
            await logInAsUserNum( 1 );
            await request( {
                method: 'PUT',
                url: apiUrl + '/races/' + raceIds[0],
                body: newData,
                json: true,
                jar: true
            } );
            const race0 = await request( {
                method: 'GET',
                url: apiUrl + '/races/' + raceIds[0],
                json: true,
                jar: true
            } );

            expect( race0.username ).to.equal( 'username1' );
        } );

        it( 'does not affect other races', async function( ) {
            const newData = {
                name: 'New Race Name',
                resultsUrl: 'https://racesresults.example.com?race=newrace',
                city: 'Oaktown',
                country: 'US',
                result: 'disqualified',
                overallTotal: 500,
                genderTotal: 50,
                divisionTotal: 5,
                notes: 'Just updating some fields'
            };

            await logInAsUserNum( 1 );
            await request( {
                method: 'PUT',
                url: apiUrl + '/races/' + raceIds[ 0 ],
                body: newData,
                json: true,
                jar: true
            } );
            const race1 = await request( {
                method: 'GET',
                url: apiUrl + '/races/' + raceIds[1],
                json: true,
                jar: true
            } );

            expect( race1.name ).to.equal( 'Race Name 1' );
        } );
    } );

    describe( 'DELETE /races/:id', function( ) {
        let raceIds;
        beforeEach( async function( ) {
            raceIds = await create9UsersFriendsAndRaces( );
        } );

        it( 'returns 403 if not logged in', async function( ) {
            const response = await request( {
                method: 'DELETE',
                url: apiUrl + '/races/' + raceIds[0],
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
                url: apiUrl + '/races/' + raceIds[0],
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
                url: apiUrl + '/races/' + raceIds[0],
                jar: true
            } );
            const races1 = await request( {
                method: 'GET',
                url: apiUrl + '/users/' + 'username1' + '/races',
                json: true,
                jar: true
            } );

            expect( races1.length ).to.equal( 1 );
            expect( races1[ 0 ].name ).to.equal( 'Race Name 1' );
        } );

        it( 'succeeds if the race already does not exist', async function( ) {
            await request( {
                method: 'DELETE',
                url: apiUrl + '/races/' + -99,
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