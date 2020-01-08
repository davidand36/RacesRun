/*
    gregDate.js

    Wrapper of Date, representing a Gregorian date, not a date-and-time
*/

let numericFormat;
let shortFormat;
let longFormat;

export class GregDate {
    constructor( ...args ) {
        this.date = newCls( Date, args );
    }

    toString( fmt ) {
        switch ( fmt ) {
            default:
            case 'html':
                this.htmlStr = this.htmlStr || makeHtmlStr( this.date );
                return this.htmlStr;
            case 'numeric':
                this.numericStr = this.numericStr || makeNumericStr( this.date );
                return this.numericStr;
            case 'short':
                this.shortStr = this.shortStr || makeShortStr( this.date );
                return this.shortStr;
            case 'long':
                this.longStr = this.longStr || makeLongStr( this.date );
                return this.longStr;
        }

        //---------------------------------------------------------------------

        function makeHtmlStr( date ) {
            return date.toISOString().substring( 0, 10 );
        }

        //---------------------------------------------------------------------

        function makeNumericStr( date ) {
            numericFormat = numericFormat || makeNumericFormat();
            return numericFormat.format( date );

            //-----------------------------------------------------------------

            function makeNumericFormat( ) {
                return new Intl.DateTimeFormat( );                
            }
        }

        //---------------------------------------------------------------------

        function makeShortStr( date ) {
            shortFormat = shortFormat || makeShortFormat();
            return shortFormat.format( date );

            //-----------------------------------------------------------------

            function makeShortFormat( ) {
                const loc = navigator.language;
                return new Intl.DateTimeFormat( loc, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                 } );
            }
        }

        //---------------------------------------------------------------------

        function makeLongStr( date ) {
            longFormat = longFormat || makeLongFormat();
            return longFormat.format( date );

            //-----------------------------------------------------------------

            function makeLongFormat( ) {
                const loc = navigator.language;
                return new Intl.DateTimeFormat( loc, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                } );
            }
        }
    }
}

//=============================================================================

// Thanks to https://stackoverflow.com/questions/1606797/use-of-apply-with-new-operator-is-this-possible

function newCls( Cls ) {
    return new ( Cls.bind.apply( Cls, arguments ) );
}

//=============================================================================
