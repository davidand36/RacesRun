\c races

CREATE TYPE gender AS ENUM ('female', 'male', 'non-binary' );
CREATE TYPE visibility AS ENUM ('public', 'users', 'friends', 'private');
CREATE TABLE users (
    username        varchar(25) PRIMARY KEY,
    full_name       varchar(100) NOT NULL,
    gender          gender,
    date_of_birth   date,
    email           varchar(250) UNIQUE,
    visibility      visibility NOT NULL DEFAULT 'private',
    CONSTRAINT users_date_of_birth_check CHECK (date_of_birth < CURRENT_DATE)
);
CREATE INDEX users_fullname_idx ON users (full_name);
CREATE INDEX users_visibility_idx ON users (visibility);
GRANT ALL PRIVILEGES ON TABLE users TO dbracesuser;


CREATE TABLE passwords (
    username        varchar(25) PRIMARY KEY,
    pass_hash       jsonb NOT NULL,
    FOREIGN KEY (username) REFERENCES users ON DELETE CASCADE
);
GRANT ALL PRIVILEGES ON TABLE passwords TO dbracesuser;


CREATE TABLE friends (
    username        varchar(25) NOT NULL,
    friend          varchar(25) NOT NULL,
    PRIMARY KEY (username, friend),
    FOREIGN KEY (username) REFERENCES users ON DELETE CASCADE,
    FOREIGN KEY (friend) REFERENCES users ON DELETE CASCADE
);
GRANT ALL PRIVILEGES ON TABLE friends TO dbracesuser;


CREATE SEQUENCE races_seq;
CREATE TYPE result_type AS ENUM ('finished', 'did not start', 'did not finish', 'disqualified');
CREATE TABLE races (
    id              integer PRIMARY KEY DEFAULT nextval('races_seq'),
    username        varchar(25) NOT NULL,
    name            varchar(100) NOT NULL,
    url             varchar(250),
    results_url     varchar(250),
    date            date NOT NULL,
    city            varchar(50) NOT NULL,
    state           varchar(25),
    country         varchar(25) NOT NULL,
    bib             varchar(25),
    scoring         varchar(25) DEFAULT 'individual',
    result          result_type NOT NULL DEFAULT 'finished',
    overall_place   integer,
    overall_total   integer,
    gender_place    integer,
    gender_total    integer,
    division_place  integer,
    division_total  integer,
    division_name   varchar(25),
    notes           varchar(1000),
    FOREIGN KEY (username) REFERENCES users ON DELETE CASCADE,
    CHECK (id > 0),
    CONSTRAINT races_date_check CHECK (date <= CURRENT_DATE),
    CONSTRAINT races_overall_place_check CHECK (overall_place > 0 AND overall_place <= overall_total),
    CONSTRAINT races_gender_place_check CHECK (gender_place > 0 AND gender_place <= gender_total),
    CONSTRAINT races_division_place_check CHECK (division_place > 0 AND division_place <= division_total)
);
CREATE INDEX races_user_date_idx ON races (username, date);
GRANT ALL PRIVILEGES ON SEQUENCE races_seq TO dbracesuser;
GRANT ALL PRIVILEGES ON TABLE races TO dbracesuser;

CREATE SEQUENCE legs_seq;
CREATE TYPE distance_unit AS ENUM ('m', 'km', 'mi', 'marathon');
CREATE TABLE legs (
    id              integer PRIMARY KEY DEFAULT nextval('legs_seq'),
    race            integer NOT NULL,
    distance        real NOT NULL,
    unit            distance_unit NOT NULL DEFAULT 'km',
    sport           varchar(25) DEFAULT 'running',
    terrain         varchar(25) DEFAULT 'road',
    chip_time       real,
    gun_time        real,
    FOREIGN KEY (race) REFERENCES races ON DELETE CASCADE,
    CHECK (id > 0),
    CONSTRAINT legs_distance_check CHECK (distance > 0),
    CONSTRAINT legs_chip_time_check CHECK (chip_time > 0),
    CONSTRAINT legs_gun_time_check CHECK (gun_time > 0)
);
GRANT ALL PRIVILEGES ON SEQUENCE legs_seq TO dbracesuser;
GRANT ALL PRIVILEGES ON TABLE legs TO dbracesuser;
