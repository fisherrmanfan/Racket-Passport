'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool } = require('./db');

const app = express();
app.use(cors());

const CATALOG_SELECT = `
  SELECT racket_id, source_id, manufacturer, name, head_size, length,
         weight_oz, weight_g, balance_pts, balance_type, balance_mm,
         swingweight, stiffness, beam_width, power_level, string_pattern,
         tension, composition_clean, main_skip_clean, image_url
  FROM racket_catalog`;

app.get('/health', (_, res) => res.json({ status: 'ok' }));

/**
 * GET /autocomplete?q=blade+9&limit=10
 * Typeahead suggestions as the user types, ranked by trigram similarity
 * (typo-tolerant) with a plain prefix match folded in for short queries
 * where similarity scores alone are too weak to rank well.
 */
app.get('/autocomplete', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ suggestions: [] });
    const limit = Math.min(parseInt(req.query.limit || '10', 10) || 10, 25);

    const { rows } = await pool.query(
      `SELECT r.id AS racket_id, m.name AS manufacturer, r.name,
              word_similarity($1, r.name) AS score
       FROM racket_rackets r
       JOIN racket_manufacturers m ON m.id = r.manufacturer_id
       LEFT JOIN racket_metrics t ON t.racket_id = r.id
       WHERE COALESCE(t.is_junk, false) = false
         AND ($1 <% r.name OR r.name ILIKE $2 OR m.name ILIKE $2)
       ORDER BY score DESC, r.name ASC
       LIMIT $3`,
      [q, `${q}%`, limit]
    );
    res.json({ suggestions: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /match?q=biomimetic tour
 * Ports browse.html's word-order-independent name match server-side:
 * every typed word must appear somewhere in the racket name. Returns the
 * matching row(s) with full specs, shortest (closest) name match first.
 */
app.get('/match', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.status(400).json({ error: 'Missing q parameter' });
    const words = q.split(/\s+/).filter(Boolean);

    const params = [];
    const clauses = words.map((w) => {
      params.push(`%${w}%`);
      return `name ILIKE $${params.length}`;
    });
    const limit = Math.min(parseInt(req.query.limit || '5', 10) || 5, 50);
    params.push(limit);

    const { rows } = await pool.query(
      `${CATALOG_SELECT}
       WHERE ${clauses.join(' AND ')}
       ORDER BY length(name) ASC
       LIMIT $${params.length}`,
      params
    );
    res.json({ count: rows.length, rackets: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /rackets/:id — by numeric racket_id or source_id (pcode). */
app.get('/rackets/:id', async (req, res) => {
  try {
    const byId = /^[0-9]+$/.test(req.params.id);
    const { rows } = await pool.query(
      `${CATALOG_SELECT} WHERE ${byId ? 'racket_id = $1::int' : 'source_id = $1'}`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /rackets — filterable browse list.
 * Query params: manufacturer, name (partial), hsMin/hsMax, wMin/wMax
 * (oz), swMin/swMax, fMin/fMax (RA stiffness), limit (default 50, max 500), offset
 */
app.get('/rackets', async (req, res) => {
  try {
    const where = [];
    const params = [];
    const add = (sql, value) => {
      params.push(value);
      where.push(sql.replace('?', `$${params.length}`));
    };

    const q = req.query;
    if (q.manufacturer) add('manufacturer ILIKE ?', q.manufacturer);
    if (q.name) add('name ILIKE ?', `%${q.name}%`);
    const ranges = [
      ['hsMin', 'head_size >= ?'], ['hsMax', 'head_size <= ?'],
      ['wMin', 'weight_oz >= ?'], ['wMax', 'weight_oz <= ?'],
      ['swMin', 'swingweight >= ?'], ['swMax', 'swingweight <= ?'],
      ['fMin', 'stiffness >= ?'], ['fMax', 'stiffness <= ?'],
    ];
    for (const [key, sql] of ranges) {
      if (q[key] !== undefined && q[key] !== '') add(sql, parseFloat(q[key]));
    }

    const limit = Math.min(parseInt(q.limit || '50', 10) || 50, 500);
    const offset = Math.max(parseInt(q.offset || '0', 10) || 0, 0);
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const { rows } = await pool.query(
      `${CATALOG_SELECT} ${whereSql} ORDER BY manufacturer, name LIMIT ${limit} OFFSET ${offset}`,
      params
    );
    res.json({ count: rows.length, limit, offset, rackets: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Racket Passport API on http://localhost:${PORT}`));
