const pool = require('../config');

const roleResolvers = require('./roles');

const userResolvers = {
    allUsers: ({ query }) => {
        let params = [];
        let sql = 'SELECT * FROM ems_user';
        // If we're supplied with some user IDs, we must use those to filter
        // our requested records
        if (query.user_ids) {
            // user_ids should be a underscore delimited string of IDs
            params = query.user_ids.split('_').map(param => parseInt(param));
            sql += ' WHERE id IN (' +
                params.map((param, idx) => `$${idx + 1}`).join(', ') +
                ')';
        }
        sql += ' ORDER BY name ASC';
        return pool.query(sql, params);
    },
    getUser: ({ params }) =>
        pool.query('SELECT u.*, r.code AS role_code FROM ems_user u INNER JOIN role r ON r.id = u.role_id WHERE u.id = $1', [params.id]),
    getUserByProvider: ({ params }) =>
        pool.query('SELECT * FROM ems_user WHERE provider = $1 AND provider_id = $2', [params.provider, params.providerId]),
    upsertUser: ({ params, body }) => {
        // If we have an ID, we're updating
        if (params && params.id) {
            return pool.query(
                'UPDATE ems_user SET name = $1, role_id = $2, provider_meta = $3, avatar = $4, updated_at = NOW() WHERE id = $5 RETURNING *',
                [body.name, body.role_id, body.provider_meta, body.avatar, params.id]
            );
        } else {
            // Give the new user the CUSTOMER role
            return roleResolvers.getRoleByCode({ params: { code: 'CUSTOMER' } })
                .then((roles) => {
                    if (roles.rowCount === 1) {
                        const role = roles.rows[0].id;
                        return pool.query(
                            'INSERT INTO ems_user VALUES (default, $1, $2, NOW(), NOW(), $3, $4, $5, $6) RETURNING *',
                            [body.name, role, body.provider, body.provider_id, body.provider_meta, body.avatar]
                        );
                    }
                });
        }
    },
    upsertUserByProviderId: ({
        provider,
        providerId,
        providerMeta,
        name,
        avatar
    }) => {
        // Check if this user already exists
        return userResolvers.getUserByProvider({ params: { provider, providerId } })
            .then((result) => {
                if (result.rowCount === 1) {
                    // User exists, update them
                    const user = result.rows[0];
                    return userResolvers.upsertUser({
                        params: {
                            id: user.id
                        },
                        body: {
                            name,
                            role_id: user.role_id,
                            provider_meta: providerMeta,
                            avatar,
                            provider_id: user.provider_id
                        }
                    });
                } else {
                    return userResolvers.upsertUser({
                        body: {
                            name,
                            provider,
                            provider_id: providerId,
                            provider_meta: providerMeta,
                            avatar
                        }
                    });
                }
            })
            .catch((err) => err);
    },
    deleteUser: ({ params }) =>
        pool.query('DELETE FROM ems_user WHERE id = $1', [params.id])
};

module.exports = userResolvers;
