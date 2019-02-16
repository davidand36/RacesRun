/*
    dbService.test.js

    Tests of dbService

    See https://mochajs.org/
    and https://www.chaijs.com/
*/

const expect = require( 'chai' ).expect;
const dbService = require( './dbService' );

describe( 'dbService', function( ) {
    before( async function () {
        await dbService.reconnect();
    } );

    beforeEach( async function( ) {
        dbService.deleteAll( );
    } );

    after( dbService.disconnect );


    async function createUsers( n ) {
        await dbService.createUser( {
            username: 'username1',
            fullName: 'Full Name 1',
            gender: 'male',
            dateOfBirth: new Date( 1969, 6, 20 ),
            email: 'username1@example.com',
            visibility: 'public',
            password: 'secret1'
        } );
        for ( let i = 2; i <= n; ++i ) {
            const userData = {
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
            await dbService.createUser( userData );
        }
    }

    async function create3Users( ) {
        await createUsers( 3 );
    }

    async function createUsersAndFriends( n ) {
        await createUsers( n );
        for ( let i = 1; i <= n; ++i ) {
            if ( i % 8 === 2 ) {
                for ( let j = 1; j <= n; ++j ) {
                    if ( j % 2 === 1 ) {
                        await dbService.addFriend( 'username' + i, 'username' + j );
                    }
                }
            }
            if ( i % 8 === 6 ) {
                for ( let j = 1; j <= n; ++j ) {
                    if ( (j % 2 === 0) && (i !== j) ) {
                        await dbService.addFriend( 'username' + i, 'username' + j );
                    }
                }
            }
        }
    }

    async function create9UsersAndFriends( ) {
        await createUsersAndFriends( 9 );
    }

    async function create3UsersAnd3Races( ) {
        await create3Users( );
        const raceId1 = await dbService.createRace( {
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
        } );
        const raceId2 = await dbService.createRace( {
            username: 'username2',
            name: 'Race Name 2',
            date: new Date( 2016, 3, 5 ),
            city: 'Sometown',
            country: 'US',
            distance: 0.5,
            unit: 'marathon'
        } );
        const raceId3 = await dbService.createRace( {
            username: 'username1',
            name: 'Race Name 3',
            date: new Date( 2018, 7, 14 ),
            city: 'Mytown',
            state: 'OR',
            country: 'US',
            distance: 5
        } );

        return [ raceId1, raceId2, raceId3 ];
    }


    describe( 'createUser', function( ) {
        it( 'adds a user to the DB', async function( ) {
            const fullData = {
                username: 'username1',
                fullName: 'Full Name 1',
                gender: 'male',
                dateOfBirth: new Date( 1969, 6, 20 ),
                email: 'username1@example.com',
                visibility: 'public',
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
            let error;
            await dbService.createUser( badData )
            .catch( function( err ) {
                error = err;
            } );

            expect( error.message ).to.equal( 'Data Error: Username is required' );
        } );

        it( 'requires fullName', async function( ) {
            const badData = {
                username: 'username1',
                password: 'secret1',
            };
            let error;
            await dbService.createUser( badData )
            .catch( function ( err ) {
                error = err;
            } );

            expect( error.message ).to.equal( 'Data Error: Full Name is required' );
        } );

        it( 'requires password', async function( ) {
            const badData = {
                username: 'username1',
                fullName: 'Full Name 1'
            };
            let error;
            await dbService.createUser( badData )
            .catch( function ( err ) {
                error = err;
            } );

            expect( error.message ).to.equal( 'Data Error: Password is required' );
        } );

        it( 'limits the length of username', async function( ) {
            const badData = {
                username: '12345678901234567890123456',
                fullName: 'Full Name 1',
                password: 'secret1',
            };
            let error;
            await dbService.createUser( badData )
            .catch( function ( err ) {
                error = err;
            } );

            expect( error.message ).to.equal( 'Data Error: invalid data' );
        } );

        it( 'requires unique usernames', async function( ) {
            const data1 = {
                username: 'username1',
                fullName: 'Full Name 1',
                password: 'secret1',
            };
            const data2 = {
                username: 'username1',
                fullName: 'Full Name 2',
                password: 'secret2',
            };
            let error;
            await dbService.createUser( data1 );
            await dbService.createUser( data2 )
            .catch( function( err ) {
                error = err;
            } );

            expect( error.message ).to.equal( 'Data Error: This Username is already registered' );
        } );

        it( 'requires unique emails', async function () {
            const data1 = {
                username: 'username1',
                fullName: 'Full Name 1',
                email: 'username1@example.com',
                password: 'secret1',
            };
            const data2 = {
                username: 'username2',
                fullName: 'Full Name 2',
                email: 'username1@example.com',
                password: 'secret2',
            };
            let error;
            await dbService.createUser( data1 );
            await dbService.createUser( data2 )
                .catch( function ( err ) {
                    error = err;
                } );

            expect( error.message ).to.equal( 'Data Error: This Email Address is already registered' );
        } );

        it( 'rejects invalid gender', async function( ) {
            const badData = {
                username: 'username1',
                fullName: 'Full Name 1',
                gender: 'woman',
                password: 'secret1',
            };

            let error;
            await dbService.createUser( badData )
                .catch( function ( err ) {
                    error = err;
                } );

            expect( error.message ).to.equal( 'Data Error: Invalid value for Gender' );
        } );

        it( 'rejects invalid visibility', async function( ) {
            const badData = {
                username: 'username1',
                fullName: 'Full Name 1',
                visibility: 'everyone',
                password: 'secret1'
            };

            let error;
            await dbService.createUser( badData )
                .catch( function ( err ) {
                    error = err;
                } );

            expect( error.message ).to.equal( 'Data Error: Invalid value for Visibility' );
        } );

        it( 'rejects future date of birth', async function( ) {
            const thisYear = new Date().getFullYear();
            const badData = {
                username: 'username1',
                fullName: 'Full Name 1',
                dateOfBirth: new Date( thisYear + 1, 6, 20 ),
                password: 'secret1',
            };

            let error;
            await dbService.createUser( badData )
                .catch( function ( err ) {
                    error = err;
                } );

            expect( error.message ).to.equal( 'Data Error: Invalid Date of Birth' );
        } );
    } );

    describe( 'getUsers', function( ) {
        beforeEach( create3Users );

        it( 'gets all users in the DB', async function( ) {
            const users = await dbService.getUsers( );

            expect( users.length ).to.equal( 3 );
            expect( users[ 1 ].fullName ).to.equal( 'Full Name 2' );
        } );

        it( 'does not get email addresses', async function( ) {
            const users = await dbService.getUsers();

            expect( users[ 0 ].email ).to.be.undefined;
        } );
    } );

    describe( 'isUserVisible', function( ) {
        beforeEach( create9UsersAndFriends );

        it( 'gets correct user visibility', async function( ) {
            const vis10 = await dbService.isUserVisible( 'username1', undefined );
            const vis20 = await dbService.isUserVisible( 'username2', undefined );
            const vis30 = await dbService.isUserVisible( 'username3', undefined );
            const vis40 = await dbService.isUserVisible( 'username4', undefined );
            const vis50 = await dbService.isUserVisible( 'username5', undefined );
            const vis60 = await dbService.isUserVisible( 'username6', undefined );
            const vis11 = await dbService.isUserVisible( 'username1', 'username1' );
            const vis21 = await dbService.isUserVisible( 'username2', 'username1' );
            const vis31 = await dbService.isUserVisible( 'username3', 'username1' );
            const vis41 = await dbService.isUserVisible( 'username4', 'username1' );
            const vis51 = await dbService.isUserVisible( 'username5', 'username1' );
            const vis61 = await dbService.isUserVisible( 'username6', 'username1' );
            const vis12 = await dbService.isUserVisible( 'username1', 'username2' );
            const vis22 = await dbService.isUserVisible( 'username2', 'username2' );
            const vis32 = await dbService.isUserVisible( 'username3', 'username2' );
            const vis42 = await dbService.isUserVisible( 'username4', 'username2' );
            const vis52 = await dbService.isUserVisible( 'username5', 'username2' );
            const vis62 = await dbService.isUserVisible( 'username6', 'username2' );
            const vis13 = await dbService.isUserVisible( 'username1', 'username3' );
            const vis23 = await dbService.isUserVisible( 'username2', 'username3' );
            const vis33 = await dbService.isUserVisible( 'username3', 'username3' );
            const vis43 = await dbService.isUserVisible( 'username4', 'username3' );
            const vis53 = await dbService.isUserVisible( 'username5', 'username3' );
            const vis63 = await dbService.isUserVisible( 'username6', 'username3' );

            expect( vis10 ).to.be.true;
            expect( vis20 ).to.be.false;
            expect( vis30 ).to.be.false;
            expect( vis40 ).to.be.true;
            expect( vis50 ).to.be.false;
            expect( vis60 ).to.be.false;
            expect( vis11 ).to.be.true;
            expect( vis21 ).to.be.true;
            expect( vis31 ).to.be.false;
            expect( vis41 ).to.be.true;
            expect( vis51 ).to.be.true;
            expect( vis61 ).to.be.false;
            expect( vis12 ).to.be.true;
            expect( vis22 ).to.be.true;
            expect( vis32 ).to.be.false;
            expect( vis42 ).to.be.true;
            expect( vis52 ).to.be.true;
            expect( vis62 ).to.be.true;
            expect( vis13 ).to.be.true;
            expect( vis23 ).to.be.true;
            expect( vis33 ).to.be.true;
            expect( vis43 ).to.be.true;
            expect( vis53 ).to.be.true;
            expect( vis63 ).to.be.false;
        } );
    } );

    describe( 'getVisibleUsers', function( ) {
        beforeEach( create9UsersAndFriends );

        it( 'gets only public users if no requesting user', async function( ) {
            const users = await dbService.getVisibleUsers( );

            expect( users.length ).to.equal( 3 );
            expect( users[ 0 ].fullName ).to.equal( 'Full Name 1' ); //public
            expect( users[ 1 ].fullName ).to.equal( 'Full Name 4' ); //public
            expect( users[ 2 ].fullName ).to.equal( 'Full Name 8' ); //public
        } );

        it( 'gets correct visible users (3)', async function( ) {
            const users = await dbService.getVisibleUsers( 'username3' );

            expect( users.length ).to.equal( 7 );
            expect( users[ 0 ].fullName ).to.equal( 'Full Name 1' ); //public
            expect( users[ 1 ].fullName ).to.equal( 'Full Name 2' ); //friends
            expect( users[ 2 ].fullName ).to.equal( 'Full Name 3' ); //self
            expect( users[ 3 ].fullName ).to.equal( 'Full Name 4' ); //public
            expect( users[ 4 ].fullName ).to.equal( 'Full Name 5' ); //users
            expect( users[ 5 ].fullName ).to.equal( 'Full Name 8' ); //public
            expect( users[ 6 ].fullName ).to.equal( 'Full Name 9' ); //users
        } );

        it( 'gets correct visible users (4)', async function() {
            const users = await dbService.getVisibleUsers( 'username4' );

            expect( users.length ).to.equal( 6 );
            expect( users[ 0 ].fullName ).to.equal( 'Full Name 1' ); //public
            expect( users[ 1 ].fullName ).to.equal( 'Full Name 4' ); //self
            expect( users[ 2 ].fullName ).to.equal( 'Full Name 5' ); //users
            expect( users[ 3 ].fullName ).to.equal( 'Full Name 6' ); //friends
            expect( users[ 4 ].fullName ).to.equal( 'Full Name 8' ); //public
            expect( users[ 5 ].fullName ).to.equal( 'Full Name 9' ); //users
        } );
    } );

    describe( 'getUser', function( ) {
        beforeEach( create3Users );

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

    describe( 'getPassHash', function( ) {
        // getPassHash() is tested more fully in authService test.

        beforeEach( create3Users );

        it( 'gets an object with algorithm and key', async function( ) {
            const passHash = await dbService.getPassHash( 'username1' );

            expect( passHash ).to.have.property( 'algorithm' );
            expect( passHash ).to.have.property( 'key' );
        } );

        it( 'gets null for non-existent username', async function( ) {
            const passHash = await dbService.getPassHash( 'nonexistent' );

            expect( passHash ).to.be.null;
        } );
    } );

    describe( 'updateUser', function( ) {
        beforeEach( create3Users );

        it ( 'updates most fields', async function( ) {
            const newData = {
                fullName: 'New Name 1',
                gender: 'female',
                dateOfBirth: new Date( 1999, 9, 9 ),
                email: 'username1@foobar.org',
                visibilty: 'users'
            };
            await dbService.updateUser( 'username1', newData );
            const user = await dbService.getUser( 'username1' );

            expect( user.fullName ).to.equal( newData.fullName );
            expect( user.gender ).to.equal( newData.gender );
            expect( user.dateOfBirth.toDateString() ).to.equal( newData.dateOfBirth.toDateString() );
            expect( user.email ).to.equal( newData.email );
        } );

        it( 'does not change username', async function( ) {
            const newData = {
                username: 'newusername1'
            };
            await dbService.updateUser( 'username1', newData );
            const user = await dbService.getUser( 'username1' );

            expect( user.username ).to.equal( 'username1' );
        } );

        it( 'does not change password', async function () {
            const authService = require( '../auth/authService' );
            const newData = {
                password: 'newpassword1'
            };
            await dbService.updateUser( 'username1', newData );
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
            await dbService.updateUser( 'username1', newData );
            const user2 = await dbService.getUser( 'username2' );

            expect( user2.fullName ).to.equal( 'Full Name 2' );
            expect( user2.gender ).to.be.null;
            expect( user2.dateOfBirth ).to.be.null;
            expect( user2.email ).to.be.null;
        } );
    } );

    describe( 'updatePassword', function( ) {
        beforeEach( create3Users );

        it( 'changes the password', async function( ) {
            const authService = require( '../auth/authService' );
            await dbService.updatePassword( 'username1', 'newpassword1' );
            const valRslt1 = await authService.validateUser( 'username1', 'secret1' );
            const valRslt2 = await authService.validateUser( 'username1', 'newpassword1' );

            expect( valRslt1 ).to.be.false;
            expect( valRslt2 ).to.be.true;
        } );

        it( 'does not affect other users', async function( ) {
            const authService = require( '../auth/authService' );
            await dbService.updatePassword( 'username1', 'newpassword1' );
            const valRslt1 = await authService.validateUser( 'username2', 'secret2' );
            const valRslt2 = await authService.validateUser( 'username2', 'newpassword1' );

            expect( valRslt1 ).to.be.true;
            expect( valRslt2 ).to.be.false;
        } );
    } );

    describe( 'changePassword', function( ) {
        beforeEach( create3Users );

        it( 'changes the password when the old one is supplied', async function( ) {
            const authService = require( '../auth/authService' );
            const data = {
                currentPassword: 'secret1',
                newPassword: 'newpassword1'
            };
            await dbService.changePassword( 'username1', data );
            const valRslt = await authService.validateUser( 'username1', 'newpassword1' );

            expect( valRslt ).to.be.true;
        } );

        it( 'rejects request if wrong old password given', async function( ) {
            const data = {
                currentPassword: 'wrongpass1',
                newPassword: 'newpassword1'
            };
            let error;
            await dbService.changePassword( 'username1', data )
            .catch ( function( err ) {
                error = err;
            } );

            expect( error.message ).to.equal( 'Unauthorized' );
        } );

        it( 'rejects request if no old password given', async function () {
            const data = {
                newPassword: 'newpassword1'
            };
            let error;
            await dbService.changePassword( 'username1', data )
            .catch( function ( err ) {
                error = err;
            } );

            expect( error.message ).to.equal( 'Unauthorized' );
        } );
    } );

    describe( 'deleteUser', function( ) {
        beforeEach( create3Users );

        it( 'removes a user', async function( ) {
            await dbService.deleteUser( 'username1' );
            const users = await dbService.getUsers( );

            expect( users.length ).to.equal( 2 );
            expect( users[ 0 ].username ).to.equal( 'username2' );
        } );

        it( 'succeeds if user already does not exist', async function( ) {
            await dbService.deleteUser( 'nosuchuser' );
            const users = await dbService.getUsers();

            expect( users.length ).to.equal( 3 );
        } );
    } );

    describe( 'addFriend', function( ) {
        beforeEach( create3Users );

        it( 'adds a friend', async function( ) {
            const rslt = await dbService.addFriend( 'username1', 'username3' );

            expect( rslt.username ).to.equal( 'username1' );
            expect( rslt.friend ).to.equal( 'username3' );
        } );

        it( 'requires username', async function( ) {
            let error;
            await dbService.addFriend( null, 'username3' )
                .catch( function ( err ) {
                    error = err;
                } );

            expect( error.message ).to.equal( 'Data Error: Username is required' );
        } );

        it( 'requires friend', async function () {
            let error;
            await dbService.addFriend( 'username3' )
                .catch( function ( err ) {
                    error = err;
                } );

            expect( error.message ).to.equal( 'Data Error: Friend is required' );
        } );

        it( 'requires the user to exist', async function( ) {
            let error;
            await dbService.addFriend( 'nosuchuser', 'username3' )
            .catch( function( err ) {
                error = err;
            } );

            expect( error.message ).to.equal( 'Data Error: Username does not refer to a known user' );
        } );

        it( 'requires the friend to exist', async function () {
            let error;
            await dbService.addFriend( 'username1', 'nosuchfriend' )
                .catch( function ( err ) {
                    error = err;
                } );

            expect( error.message ).to.equal( 'Data Error: Friend does not refer to a known user' );
        } );

        it( 'does not allow duplicate username-friend pairs', async function( ) {
            await dbService.addFriend( 'username1', 'username3' );
            let error;
            await dbService.addFriend( 'username1', 'username3' )
                .catch( function ( err ) {
                    error = err;
                } );

            expect( error.message ).to.equal( 'Data Error: This Friend is already listed' );
        } );

        it( 'limits the length of username', async function () {
            let error;
            await dbService.addFriend( '123456789012345678901234567890', 'username3' )
                .catch( function ( err ) {
                    error = err;
                } );

            expect( error.message ).to.equal( 'Data Error: invalid data' );
        } );
    } );

    describe( 'getFriends', function( ) {
        beforeEach( create9UsersAndFriends );

        it( 'gets a list of friends of user', async function( ) {
            const friends1 = await dbService.getFriends( 'username1' );
            const friends2 = await dbService.getFriends( 'username2' );
            const friends6 = await dbService.getFriends( 'username6' );

            expect( friends1.length ).to.equal( 0 );
            expect( friends2.length ).to.equal( 5 );
            expect( friends6.length ).to.equal( 3 );
            expect( friends2[ 0 ].fullName ).to.equal( 'Full Name 1' );
        } );
    } );

    describe( 'deleteFriend', function( ) {
        beforeEach( create9UsersAndFriends );

        it( 'removes a friend', async function( ) {
            await dbService.deleteFriend( 'username2', 'username1' );
            const friends2 = await dbService.getFriends( 'username2' );

            expect( friends2.length ).to.equal( 4 );
         } );

        it( 'succeeds if the friend record does not exist', async function( ) {
            await dbService.deleteFriend( 'username6', 'username3' );
            const friends6 = await dbService.getFriends( 'username6' );

            expect( friends6.length ).to.equal( 3 );
        } );
    } );

    describe( 'createRace', function( ) {
        beforeEach( create3Users );

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
            const id = await dbService.createRace( fullData );

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
            const id = await dbService.createRace( minimalData );

            expect( id ).to.be.above( 0 );
        } );

        it( 'requires username', async function () {
            const badData = {
                name: 'Race Name 1',
                date: new Date( 2015, 5, 30 ),
                city: 'Sometown',
                country: 'US',
                distance: 0.5
            };
            let error;
            await dbService.createRace( badData )
                .catch( function ( err ) {
                    error = err;
                } );

            expect( error.message ).to.equal( 'Data Error: Username is required' );
        } );

        it( 'requires name', async function () {
            const badData = {
                username: 'username1',
                date: new Date( 2015, 5, 30 ),
                city: 'Sometown',
                country: 'US',
                distance: 0.5
            };
            let error;
            await dbService.createRace( badData )
                .catch( function ( err ) {
                    error = err;
                } );

            expect( error.message ).to.equal( 'Data Error: Race Name is required' );
        } );

        it( 'requires date', async function () {
            const badData = {
                username: 'username1',
                name: 'Race Name 1',
                city: 'Sometown',
                country: 'US',
                distance: 0.5
            };
            let error;
            await dbService.createRace( badData )
                .catch( function ( err ) {
                    error = err;
                } );

            expect( error.message ).to.equal( 'Data Error: Date is required' );
        } );

        it( 'requires city', async function () {
            const badData = {
                username: 'username1',
                name: 'Race Name 1',
                date: new Date( 2015, 5, 30 ),
                country: 'US',
                distance: 0.5
            };
            let error;
            await dbService.createRace( badData )
                .catch( function ( err ) {
                    error = err;
                } );

            expect( error.message ).to.equal( 'Data Error: City is required' );
        } );

        it( 'requires country', async function () {
            const badData = {
                username: 'username1',
                name: 'Race Name 1',
                date: new Date( 2015, 5, 30 ),
                city: 'Sometown',
                distance: 0.5
            };
            let error;
            await dbService.createRace( badData )
                .catch( function ( err ) {
                    error = err;
                } );

            expect( error.message ).to.equal( 'Data Error: Country is required' );
        } );

        it( 'requires distance', async function () {
            const badData = {
                username: 'username1',
                name: 'Race Name 1',
                date: new Date( 2015, 5, 30 ),
                city: 'Sometown',
                country: 'US'
            };
            let error;
            await dbService.createRace( badData )
                .catch( function ( err ) {
                    error = err;
                } );

            expect( error.message ).to.equal( 'Data Error: Distance is required' );
        } );

        it( 'requires the user to exist', async function () {
            const badData = {
                username: 'nosuchuser',
                name: 'Race Name 1',
                date: new Date( 2015, 5, 30 ),
                city: 'Sometown',
                country: 'US',
                distance: 0.5
            };
            let error;
            await dbService.createRace( badData )
                .catch( function ( err ) {
                    error = err;
                } );

            expect( error.message ).to.equal( 'Data Error: Username does not refer to a known user' );
        } );

        it( 'limits the length of username', async function () {
            const badData = {
                username: '123456789012345678901234567890',
                name: 'Race Name 1',
                date: new Date( 2015, 5, 30 ),
                city: 'Sometown',
                country: 'US',
                distance: 0.5
            };
            let error;
            await dbService.createRace( badData )
                .catch( function ( err ) {
                    error = err;
                } );

            expect( error.message ).to.equal( 'Data Error: invalid data' );
        } );

        it( 'limits the length of city', async function () {
            const badData = {
                username: 'username1',
                name: 'Race Name 1',
                date: new Date( 2015, 5, 30 ),
                city: '123456789012345678901234567890123456789012345678901',
                country: 'US',
                distance: 0.5
            };
            let error;
            await dbService.createRace( badData )
                .catch( function ( err ) {
                    error = err;
                } );

            expect( error.message ).to.equal( 'Data Error: invalid data' );
        } );

        it ( 'rejects future date', async function( ) {
            const thisYear = new Date().getFullYear();
            const badData = {
                username: 'username1',
                name: 'Race Name 1',
                date: new Date( thisYear + 1, 5, 30 ),
                city: 'Sometown',
                country: 'US',
                distance: 0.5
            };
            let error;
            await dbService.createRace( badData )
                .catch( function ( err ) {
                    error = err;
                } );

            expect( error.message ).to.equal( 'Data Error: Invalid value for Date' );
        } );

        it( 'rejects negative distance', async function () {
            const badData = {
                username: 'username1',
                name: 'Race Name 1',
                date: new Date( 2015, 5, 30 ),
                city: 'Sometown',
                country: 'US',
                distance: -10
            };
            let error;
            await dbService.createRace( badData )
                .catch( function ( err ) {
                    error = err;
                } );

            expect( error.message ).to.equal( 'Data Error: Invalid value for Distance' );
        } );

        it( 'rejects zero distance', async function () {
            const badData = {
                username: 'username1',
                name: 'Race Name 1',
                date: new Date( 2015, 5, 30 ),
                city: 'Sometown',
                country: 'US',
                distance: 0
            };
            let error;
            await dbService.createRace( badData )
                .catch( function ( err ) {
                    error = err;
                } );

            expect( error.message ).to.equal( 'Data Error: Invalid value for Distance' );
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
            let error;
            await dbService.createRace( badData )
                .catch( function ( err ) {
                    error = err;
                } );

            expect( error.message ).to.equal( 'Data Error: Invalid value for Unit' );
        } );

        it( 'rejects invalid result', async function () {
            const badData = {
                username: 'username1',
                name: 'Race Name 1',
                date: new Date( 2015, 5, 30 ),
                city: 'Sometown',
                country: 'US',
                distance: 0.5,
                result: 'fail'
            };
            let error;
            await dbService.createRace( badData )
                .catch( function ( err ) {
                    error = err;
                } );

            expect( error.message ).to.equal( 'Data Error: Invalid value for Result' );
        } );

        it( 'rejects negative chip time', async function () {
            const badData = {
                username: 'username1',
                name: 'Race Name 1',
                date: new Date( 2015, 5, 30 ),
                city: 'Sometown',
                country: 'US',
                distance: 0.5,
                chipTime: -3600
            };
            let error;
            await dbService.createRace( badData )
                .catch( function ( err ) {
                    error = err;
                } );

            expect( error.message ).to.equal( 'Data Error: Invalid value for Chip Time' );
        } );

        it( 'rejects negative gun time', async function () {
            const badData = {
                username: 'username1',
                name: 'Race Name 1',
                date: new Date( 2015, 5, 30 ),
                city: 'Sometown',
                country: 'US',
                distance: 0.5,
                gunTime: -600
            };
            let error;
            await dbService.createRace( badData )
                .catch( function ( err ) {
                    error = err;
                } );

            expect( error.message ).to.equal( 'Data Error: Invalid value for Gun Time' );
        } );

        it( 'rejects negative overall place', async function () {
            const badData = {
                username: 'username1',
                name: 'Race Name 1',
                date: new Date( 2015, 5, 30 ),
                city: 'Sometown',
                country: 'US',
                distance: 0.5,
                overallPlace: -6
            };
            let error;
            await dbService.createRace( badData )
                .catch( function ( err ) {
                    error = err;
                } );

            expect( error.message ).to.equal( 'Data Error: Invalid value for Overall Place' );
        } );

        it( 'rejects overall place > total', async function () {
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
            let error;
            await dbService.createRace( badData )
                .catch( function ( err ) {
                    error = err;
                } );

            expect( error.message ).to.equal( 'Data Error: Invalid value for Overall Place' );
        } );

        it( 'rejects zero gender place', async function () {
            const badData = {
                username: 'username1',
                name: 'Race Name 1',
                date: new Date( 2015, 5, 30 ),
                city: 'Sometown',
                country: 'US',
                distance: 0.5,
                genderPlace: 0
            };
            let error;
            await dbService.createRace( badData )
                .catch( function ( err ) {
                    error = err;
                } );

            expect( error.message ).to.equal( 'Data Error: Invalid value for Gender Place' );
        } );

        it( 'rejects gender place > total', async function () {
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
            let error;
            await dbService.createRace( badData )
                .catch( function ( err ) {
                    error = err;
                } );

            expect( error.message ).to.equal( 'Data Error: Invalid value for Gender Place' );
        } );

        it( 'rejects negative division place', async function () {
            const badData = {
                username: 'username1',
                name: 'Race Name 1',
                date: new Date( 2015, 5, 30 ),
                city: 'Sometown',
                country: 'US',
                distance: 0.5,
                divisionPlace: -6
            };
            let error;
            await dbService.createRace( badData )
                .catch( function ( err ) {
                    error = err;
                } );

            expect( error.message ).to.equal( 'Data Error: Invalid value for Division Place' );
        } );

        it( 'rejects division place > total', async function () {
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
            let error;
            await dbService.createRace( badData )
                .catch( function ( err ) {
                    error = err;
                } );

            expect( error.message ).to.equal( 'Data Error: Invalid value for Division Place' );
        } );
    } );

    describe( 'getRace', function( ) {
        let raceId1, raceId3;
        beforeEach( async function () {
            const ids = await create3UsersAnd3Races( );
            raceId1 = ids[ 0 ];
            raceId3 = ids[ 2 ];
        } );

        it( 'gets a race by ID', async function( ) {
            const race1 = await dbService.getRace( raceId1 );
            const race3 = await dbService.getRace( raceId3 );

            expect( race1.genderPlace ).to.equal( 50 );
            expect( race3.city ).to.equal( 'Mytown' );
        } );

        it( 'returns null for non-existent race', async function( ) {
            const race = await dbService.getRace( -10 );

            expect( race ).to.be.null;
        } );
    } );

    describe( 'getUserRaces', function( ) {
        beforeEach( create3UsersAnd3Races );

        it( "gets a user's races", async function( ) { //eslint-disable-line quotes
            const races1 = await dbService.getUserRaces( 'username1' );
            const races2 = await dbService.getUserRaces( 'username2' );
            const races3 = await dbService.getUserRaces( 'username3' );
            const races4 = await dbService.getUserRaces( 'nosuchuser' );

            expect( races1.length ).to.equal( 2 );
            expect( races2.length ).to.equal( 1 );
            expect( races3.length ).to.equal( 0 );
            expect( races4.length ).to.equal( 0 );
            expect( races1[ 1 ].state ).to.equal( 'OR' );
            expect( races2[ 0 ].date.valueOf() ).to.equal( new Date( 2016, 3, 5 ).valueOf() );
        } );
    } );

    describe( 'updateRace', function( ) {
        let raceId1, raceId2;
        beforeEach( async function () {
            const ids = await create3UsersAnd3Races();
            raceId1 = ids[ 0 ];
            raceId2 = ids[ 1 ];
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

            await dbService.updateRace( raceId1, newData );
            await dbService.updateRace( raceId2, newData );
            const race1 = await dbService.getRace( raceId1 );
            const race2 = await dbService.getRace( raceId2 );

            expect( race1.name ).to.equal( newData.name );
            expect( race2.url ).to.equal( newData.url );
            expect( race1.resultsUrl ).to.equal( newData.resultsUrl );
            expect( race2.date.valueOf() ).to.equal( newData.date.valueOf() );
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

        it( 'does not change username', async function( ) {
            const newData = {
                username: 'newusername1'
            };
            await dbService.updateRace( raceId1, newData );
            const race1 = await dbService.getRace( raceId1 );

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

            await dbService.updateRace( raceId1, newData );
            const race2 = await dbService.getRace( raceId2 );

            expect( race2.name ).to.equal( 'Race Name 2' );
        } );
    } );

    describe( 'deleteRace', function( ) {
        let raceId1;
        beforeEach( async function () {
            const ids = await create3UsersAnd3Races();
            raceId1 = ids[ 0 ];
        } );

        it( 'removes a race from the DB', async function( ) {
            await dbService.deleteRace( raceId1 );
            const races1 = await dbService.getUserRaces( 'username1' );

            expect( races1.length ).to.equal( 1 );
            expect( races1[ 0 ].name ).to.equal( 'Race Name 3' );
        } );

        it( 'succeeds if the race already does not exist', async function( ) {
            await dbService.deleteRace( -10 );
            const races1 = await dbService.getUserRaces( 'username1' );

            expect( races1.length ).to.equal( 2 );
        } );
    } );
} );
