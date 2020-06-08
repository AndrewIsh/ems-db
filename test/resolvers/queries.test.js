// The thing we're testing
const queries = require('../../resolvers/queries');

// The module that queries.js depends on (which we're about to mock)
const pool = require('../../config');

// Mock pool
jest.mock('../../config', () => ({
    // A mock query function
    query: jest.fn((sql, params) => {
        new Promise((resolve) => {
            return resolve(true);
        });
    })
}));

describe('Queries', () => {
    describe('allQueries', () => {
        // Make the call
        queries.allQueries({ query: {} });
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be passed correct SQL', (done) => {
            expect(pool.query).toBeCalledWith(
                'SELECT * FROM query ORDER BY updated_at DESC', []
            );
            done();
        });
        // Pass title, offset and limit parameters
        queries.allQueries({ query: { title: 'hello', offset: 20, limit: 10 } });
        it('should be passed correct SQL including paramters', (done) => {
            expect(pool.query).toBeCalledWith(
                "SELECT * FROM query WHERE title ILIKE '%' || $1 || '%' ORDER BY updated_at DESC OFFSET $2 LIMIT $3",
                ['hello', 20, 10]
            );
            done();
        });
    });
    describe('getQuery', () => {
        // Make the call
        queries.getQuery({ params: { id: 1 } });
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be passed correct parameters', (done) => {
            expect(
                pool.query
            ).toBeCalledWith('SELECT * FROM query WHERE id = $1', [1]);
            done();
        });
    });
    describe('upsertQuery', () => {
        // Make the call *with an ID*
        queries.upsertQuery({
            params: { id: 1 },
            body: { title: 'Fred', folder_id: 1, initiator: 1 }
        });
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be called as an UPDATE when ID is passed', (done) => {
            expect(
                pool.query
            ).toBeCalledWith(
                'UPDATE query SET title = $1, folder_id = $2, initiator = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
                ['Fred', 1, 1, 1]
            );
            done();
        });
        // Make the call *without an ID*
        queries.upsertQuery({
            params: {},
            body: { title: 'Fred', folder_id: 1, initiator: 1 }
        });
        it('should be called as an INSERT when ID is not passed', (done) => {
            expect(
                pool.query
            ).toBeCalledWith(
                'INSERT INTO query VALUES (DEFAULT, $1, $2, NOW(), NOW(), $3) RETURNING *',
                ['Fred', 1, 1]
            );
            done();
        });
    });
    describe('deleteQuery', () => {
        // Make the call
        queries.deleteQuery({ params: { id: 1 } });
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be passed correct parameters', (done) => {
            expect(pool.query).toBeCalledWith(
                'DELETE FROM query WHERE id = $1',
                [1]
            );
            done();
        });
    });
    describe('initiators', () => {
        // Make the call
        queries.initiators([1,2,3]);
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be passed correct parameters', (done) => {
            expect(
                pool.query
            ).toBeCalledWith('SELECT id, initiator FROM query WHERE id IN ($1, $2, $3)', [1, 2, 3]);
            done();
        });
    });
    describe('participants', () => {
        // Make the call
        queries.participants([1, 2, 3]);
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be passed correct parameters', (done) => {
            expect(
                pool.query
            ).toBeCalledWith('SELECT query_id, creator_id FROM message WHERE query_id IN ($1, $2, $3) GROUP BY query_id, creator_id', [1, 2, 3]);
            done();
        });
    });
    describe('latestMessages', () => {
        // Make the call
        queries.latestMessages([1, 2, 3]);
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be passed correct parameters', (done) => {
            expect(
                pool.query
            ).toBeCalledWith('SELECT * from message WHERE id IN (SELECT MAX(id) FROM message WHERE query_id IN ($1, $2, $3) GROUP BY query_id)', [1, 2, 3]);
            done();
        });
    });
});
