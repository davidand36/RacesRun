\c races

CREATE TYPE gender AS ENUM ('female', 'male', 'other/none' );
CREATE TYPE visibility AS ENUM ('all', 'users', 'friends', 'private');
CREATE TABLE users (
    username        varchar(25) PRIMARY KEY,
    full_name       varchar(100) NOT NULL,
    gender          gender,
    date_of_birth   date,
    email           varchar(250) UNIQUE,
    visibility      visibility NOT NULL DEFAULT 'private',
    CHECK (date_of_birth < CURRENT_DATE)
);
CREATE INDEX users_fullname ON users (full_name);
GRANT ALL PRIVILEGES ON TABLE users TO dbracesuser;


CREATE TABLE passwords (
    username        varchar(25) PRIMARY KEY,
    pass_hash       jsonb NOT NULL,
    FOREIGN KEY (username) REFERENCES users ON DELETE CASCADE
);
GRANT ALL PRIVILEGES ON TABLE passwords TO dbracesuser;


CREATE TABLE friends (
    id              SERIAL PRIMARY KEY,
    username        varchar(25) NOT NULL,
    friend          varchar(25) NOT NULL,
    FOREIGN KEY (username) REFERENCES users ON DELETE CASCADE,
    FOREIGN KEY (friend) REFERENCES users ON DELETE CASCADE,
    UNIQUE (username, friend)
);
GRANT ALL PRIVILEGES ON TABLE friends TO dbracesuser;


CREATE TYPE distance_unit AS ENUM ('m', 'km', 'mi', 'marathon');
CREATE TYPE result_type AS ENUM ('finished', 'did not start', 'did not finish');
CREATE TABLE races (
    id              SERIAL PRIMARY KEY,
    username        varchar(25) NOT NULL,
    name            varchar(100) NOT NULL,
    url             varchar(250),
    results_url     varchar(250),
    date            date NOT NULL,
    city            varchar(50) NOT NULL,
    state           varchar(25),
    country         varchar(25) NOT NULL,
    distance        real NOT NULL,
    unit            distance_unit NOT NULL DEFAULT 'km',
    bib             varchar(25),
    result          result_type NOT NULL DEFAULT 'finished',
    chip_time       real,
    gun_time        real,
    overall_place   integer,
    overall_total   integer,
    gender_place    integer,
    gender_total    integer,
    division_place  integer,
    division_total  integer,
    division_name   varchar(25),
    notes           varchar(1000),
    FOREIGN KEY (username) REFERENCES users ON DELETE CASCADE,
    CHECK (distance > 0),
    CHECK (overall_place > 0 AND overall_place <= overall_total),
    CHECK (gender_place > 0 AND gender_place <= gender_total),
    CHECK (division_place > 0 AND division_place <= division_total)
);
CREATE INDEX races_user ON races (username);
CREATE INDEX races_date ON races (date);
GRANT ALL PRIVILEGES ON TABLE races TO dbracesuser;
