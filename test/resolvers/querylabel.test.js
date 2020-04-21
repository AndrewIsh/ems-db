// The thing we're testing
const querylabels = require('../../resolvers/querylabels');

// The module that querylabels.js depends on (which we're about to mock)
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

describe('QueryLabels', () => {
    describe('addLabelToQuery', () => {
        querylabels.addLabelToQuery({
            body: { query_id: 1, label_id: 2 }
        });
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be called with correct parameters', (done) => {
            expect(
                pool.query
            ).toBeCalledWith(
                'INSERT INTO querylabel VALUES ($1, $2, NOW(), NOW()) RETURNING *',
                [1, 2]
            );
            done();
        });
    });
    describe('removeLabelFromQuery', () => {
        querylabels.removeLabelFromQuery({
            body: { query_id: 1, label_id: 2 }
        });
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be called with correct parameters', (done) => {
            expect(
                pool.query
            ).toBeCalledWith(
                'DELETE FROM querylabel WHERE query_id = $1 AND label_id = $2',
                [1, 2]
            );
            done();
        });
    });
});
