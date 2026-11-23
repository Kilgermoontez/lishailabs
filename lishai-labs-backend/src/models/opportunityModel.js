import pool from '../config/db.js';

const OPPORTUNITY_WITH_COUNTS_SELECT = `
  SELECT
    o.id,
    o.title,
    o.slug,
    o.description,
    o.location,
    o.type,
    o.image,
    o.status,
    o.application_limit,
    o.created_at,
    o.updated_at,
    COUNT(oa.id)::int AS applications_count,
    CASE
      WHEN o.application_limit IS NULL THEN NULL
      ELSE GREATEST(o.application_limit - COUNT(oa.id)::int, 0)
    END AS remaining_applications
  FROM opportunities o
  LEFT JOIN opportunity_applications oa ON oa.opportunity_id = o.id
`;

export const OpportunityModel = {
  async findAll({ status, limit = 100, offset = 0 } = {}) {
    const params = [];
    const whereClauses = [];

    if (status) {
      params.push(status);
      whereClauses.push(`o.status = $${params.length}`);
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 200);
    const safeOffset = Math.max(Number(offset) || 0, 0);

    params.push(safeLimit);
    const limitIndex = params.length;
    params.push(safeOffset);
    const offsetIndex = params.length;

    const query = `
      ${OPPORTUNITY_WITH_COUNTS_SELECT}
      ${whereSql}
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT $${limitIndex} OFFSET $${offsetIndex}
    `;

    const countQuery = `SELECT COUNT(*)::int AS total FROM opportunities o ${whereSql}`;
    const countParams = status ? [status] : [];

    const [rowsResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, countParams),
    ]);

    return {
      rows: rowsResult.rows,
      total: countResult.rows[0]?.total || 0,
    };
  },

  async findById(id) {
    const query = `
      ${OPPORTUNITY_WITH_COUNTS_SELECT}
      WHERE o.id = $1
      GROUP BY o.id
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  },

  async create({
    title,
    slug,
    description = '',
    location = '',
    type = 'General',
    image = '',
    status = 'draft',
    application_limit = null,
  }) {
    const query = `
      INSERT INTO opportunities (
        title,
        slug,
        description,
        location,
        type,
        image,
        status,
        application_limit
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [
      title,
      slug,
      description,
      location,
      type,
      image,
      status,
      application_limit,
    ];
    const { rows } = await pool.query(query, values);
    return this.findById(rows[0].id);
  },

  async update(
    id,
    {
      title,
      slug,
      description = '',
      location = '',
      type = 'General',
      image = '',
      status = 'draft',
      application_limit = null,
    }
  ) {
    const query = `
      UPDATE opportunities
      SET
        title = $1,
        slug = $2,
        description = $3,
        location = $4,
        type = $5,
        image = $6,
        status = $7,
        application_limit = $8,
        updated_at = NOW()
      WHERE id = $9
      RETURNING id
    `;
    const values = [
      title,
      slug,
      description,
      location,
      type,
      image,
      status,
      application_limit,
      id,
    ];
    const { rows } = await pool.query(query, values);
    if (!rows[0]) return null;
    return this.findById(rows[0].id);
  },

  async remove(id) {
    const { rowCount } = await pool.query('DELETE FROM opportunities WHERE id = $1', [id]);
    return rowCount > 0;
  },

  async findAllApplications() {
    const query = `
      SELECT
        oa.id,
        oa.opportunity_id,
        o.title AS opportunity_title,
        oa.name,
        oa.email,
        oa.phone,
        oa.description,
        oa.cv_url,
        oa.application_letter_url,
        oa.status,
        oa.created_at
      FROM opportunity_applications oa
      INNER JOIN opportunities o ON o.id = oa.opportunity_id
      ORDER BY oa.created_at DESC
    `;
    const { rows } = await pool.query(query);
    return rows;
  },

  async findApplicationById(id) {
    const query = `
      SELECT
        oa.id,
        oa.opportunity_id,
        o.title AS opportunity_title,
        oa.name,
        oa.email,
        oa.phone,
        oa.description,
        oa.cv_url,
        oa.application_letter_url,
        oa.status,
        oa.created_at
      FROM opportunity_applications oa
      INNER JOIN opportunities o ON o.id = oa.opportunity_id
      WHERE oa.id = $1
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  },

  async createApplicationWithLimitCheck({
    opportunity_id,
    name,
    email,
    phone,
    description,
    cv_url,
    application_letter_url,
  }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const oppResult = await client.query(
        'SELECT id, title, status, application_limit FROM opportunities WHERE id = $1 FOR UPDATE',
        [opportunity_id]
      );
      const opportunity = oppResult.rows[0];

      if (!opportunity) {
        const error = new Error('Opportunity not found.');
        error.statusCode = 404;
        throw error;
      }

      if (opportunity.status !== 'published') {
        const error = new Error('This opportunity is not currently accepting applications.');
        error.statusCode = 400;
        throw error;
      }

      const countResult = await client.query(
        'SELECT COUNT(*)::int AS count FROM opportunity_applications WHERE opportunity_id = $1',
        [opportunity_id]
      );
      const currentCount = countResult.rows[0]?.count || 0;

      if (
        opportunity.application_limit !== null &&
        currentCount >= Number(opportunity.application_limit)
      ) {
        const error = new Error('Application limit reached for this opportunity.');
        error.statusCode = 400;
        throw error;
      }

      const insertResult = await client.query(
        `
          INSERT INTO opportunity_applications (
            opportunity_id,
            name,
            email,
            phone,
            description,
            cv_url,
            application_letter_url,
            status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
          RETURNING *
        `,
        [
          opportunity_id,
          name,
          email,
          phone,
          description,
          cv_url,
          application_letter_url,
        ]
      );

      await client.query('COMMIT');

      const newCount = currentCount + 1;
      const remaining_applications =
        opportunity.application_limit === null
          ? null
          : Math.max(Number(opportunity.application_limit) - newCount, 0);

      return {
        application: {
          ...insertResult.rows[0],
          opportunity_title: opportunity.title,
        },
        applications_count: newCount,
        remaining_applications,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async updateApplicationStatus(id, status) {
    const query = `
      UPDATE opportunity_applications
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id
    `;
    const { rows } = await pool.query(query, [status, id]);
    if (!rows[0]) return null;
    return this.findApplicationById(rows[0].id);
  },
};

export default OpportunityModel;