const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { Pool } = require('pg');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined
  }
});

// Enable CORS for React app
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://fpldataanalysis.netlify.app',
    'https://www.gameshaastra.in',
    'https://gameshaastra.in',
    process.env.FRONTEND_URL // Allow environment variable override
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize database with cursor schema
async function initializeDatabase() {
  try {
    // Create a temporary pool without SSL for schema creation
    const tempPool = new Pool({
      connectionString: process.env.DATABASE_URL.replace('?sslmode=require', ''),
      ssl: false
    });
    
    const client = await tempPool.connect();
    
    // Create cursor schema if it doesn't exist
    await client.query('CREATE SCHEMA IF NOT EXISTS cursor');
    
    // Drop existing tables to recreate with correct schema
    await client.query('DROP TABLE IF EXISTS cursor.players CASCADE');
    await client.query('DROP TABLE IF EXISTS cursor.teams CASCADE');
    await client.query('DROP TABLE IF EXISTS cursor.positions CASCADE');
    await client.query('DROP TABLE IF EXISTS cursor.gameweeks CASCADE');
    
    // Create teams table
    await client.query(`
      CREATE TABLE IF NOT EXISTS cursor.teams (
        id SERIAL PRIMARY KEY,
        team_code INTEGER UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        short_name VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create positions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS cursor.positions (
        id SERIAL PRIMARY KEY,
        position_id INTEGER UNIQUE NOT NULL,
        singular_name VARCHAR(50) NOT NULL,
        plural_name VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create gameweeks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS cursor.gameweeks (
        id SERIAL PRIMARY KEY,
        gameweek_id INTEGER UNIQUE NOT NULL,
        name VARCHAR(50) NOT NULL,
        deadline_time TIMESTAMP,
        is_current BOOLEAN DEFAULT FALSE,
        is_next BOOLEAN DEFAULT FALSE,
        is_previous BOOLEAN DEFAULT FALSE,
        finished BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create players table (for summary/accumulated data)
    await client.query(`
      CREATE TABLE IF NOT EXISTS cursor.players (
        id SERIAL PRIMARY KEY,
        fpl_id INTEGER NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        second_name VARCHAR(100) NOT NULL,
        team_code INTEGER REFERENCES cursor.teams(team_code),
        position_id INTEGER REFERENCES cursor.positions(position_id),
        now_cost INTEGER,
        total_points INTEGER,
        form DECIMAL(10,2),
        points_per_game DECIMAL(10,2),
        value_form DECIMAL(10,2),
        value_season DECIMAL(10,2),
        selected_by_percent DECIMAL(10,2),
        minutes INTEGER,
        goals_scored INTEGER,
        assists INTEGER,
        clean_sheets INTEGER,
        goals_conceded INTEGER,
        own_goals INTEGER,
        penalties_saved INTEGER,
        penalties_missed INTEGER,
        yellow_cards INTEGER,
        red_cards INTEGER,
        saves INTEGER,
        bonus INTEGER,
        influence DECIMAL(10,2),
        creativity DECIMAL(10,2),
        threat DECIMAL(10,2),
        ict_index DECIMAL(10,2),
        defensive_contribution DECIMAL(10,2),
        starts INTEGER,
        expected_goals DECIMAL(10,2),
        expected_assists DECIMAL(10,2),
        expected_goal_involvements DECIMAL(10,2),
        expected_goals_conceded DECIMAL(10,2),
        expected_goals_per_90 DECIMAL(10,2),
        saves_per_90 DECIMAL(10,2),
        expected_assists_per_90 DECIMAL(10,2),
        expected_goals_conceded_per_90 DECIMAL(10,2),
        goals_conceded_per_90 DECIMAL(10,2),
        clean_sheets_per_90 DECIMAL(10,2),
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create gameweek_players table (for gameweek-specific data)
    await client.query(`
      CREATE TABLE IF NOT EXISTS cursor.gameweek_players (
        id SERIAL PRIMARY KEY,
        fpl_id INTEGER NOT NULL,
        gameweek_id INTEGER REFERENCES cursor.gameweeks(gameweek_id),
        first_name VARCHAR(100) NOT NULL,
        second_name VARCHAR(100) NOT NULL,
        team_code INTEGER REFERENCES cursor.teams(team_code),
        position_id INTEGER REFERENCES cursor.positions(position_id),
        now_cost INTEGER,
        total_points INTEGER,
        form DECIMAL(10,2),
        points_per_game DECIMAL(10,2),
        value_form DECIMAL(10,2),
        value_season DECIMAL(10,2),
        selected_by_percent DECIMAL(10,2),
        minutes INTEGER,
        goals_scored INTEGER,
        assists INTEGER,
        clean_sheets INTEGER,
        goals_conceded INTEGER,
        own_goals INTEGER,
        penalties_saved INTEGER,
        penalties_missed INTEGER,
        yellow_cards INTEGER,
        red_cards INTEGER,
        saves INTEGER,
        bonus INTEGER,
        influence DECIMAL(10,2),
        creativity DECIMAL(10,2),
        threat DECIMAL(10,2),
        ict_index DECIMAL(10,2),
        defensive_contribution DECIMAL(10,2),
        starts INTEGER,
        expected_goals DECIMAL(10,2),
        expected_assists DECIMAL(10,2),
        expected_goal_involvements DECIMAL(10,2),
        expected_goals_conceded DECIMAL(10,2),
        expected_goals_per_90 DECIMAL(10,2),
        saves_per_90 DECIMAL(10,2),
        expected_assists_per_90 DECIMAL(10,2),
        expected_goals_conceded_per_90 DECIMAL(10,2),
        goals_conceded_per_90 DECIMAL(10,2),
        clean_sheets_per_90 DECIMAL(10,2),
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Database initialized successfully with cursor schema');
    client.release();
    tempPool.end();
  } catch (error) {
    console.error('❌ Error initializing database:', error);
  }
}

// Proxy endpoint for FPL data
app.get('/api/fpl-data', async (req, res) => {
  try {
    const response = await axios.get(process.env.FPL_API_URL);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching FPL data:', error.message);
    res.status(500).json({ error: 'Failed to fetch FPL data' });
  }
});

// Store FPL data in database
app.post('/api/store-fpl-data', async (req, res) => {
  try {
    // Use the same SSL configuration as initialization
    const tempPool = new Pool({
      connectionString: process.env.DATABASE_URL.replace('?sslmode=require', ''),
      ssl: false
    });
    
    const client = await tempPool.connect();
    
    // Clear existing data
    await client.query('DELETE FROM cursor.players');
    await client.query('DELETE FROM cursor.teams');
    await client.query('DELETE FROM cursor.positions');
    
    // Insert teams
    for (const team of req.body.teams) {
      await client.query(
        'INSERT INTO cursor.teams (team_code, name, short_name) VALUES ($1, $2, $3) ON CONFLICT (team_code) DO UPDATE SET name = $2, short_name = $3',
        [team.code, team.name, team.short_name]
      );
    }
    
    // Insert positions
    for (const position of req.body.element_types) {
      await client.query(
        'INSERT INTO cursor.positions (position_id, singular_name, plural_name) VALUES ($1, $2, $3) ON CONFLICT (position_id) DO UPDATE SET singular_name = $2, plural_name = $3',
        [position.id, position.singular_name, position.plural_name]
      );
    }
    
    // Insert players
    for (const player of req.body.elements) {
      await client.query(`
        INSERT INTO cursor.players (
          fpl_id, first_name, second_name, team_code, position_id, now_cost, total_points,
          form, points_per_game, value_form, value_season, selected_by_percent, minutes,
          goals_scored, assists, clean_sheets, goals_conceded, own_goals, penalties_saved,
          penalties_missed, yellow_cards, red_cards, saves, bonus, influence, creativity,
          threat, ict_index, defensive_contribution, starts, expected_goals, expected_assists,
          expected_goal_involvements, expected_goals_conceded, expected_goals_per_90,
          saves_per_90, expected_assists_per_90, expected_goals_conceded_per_90,
          goals_conceded_per_90, clean_sheets_per_90
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
          $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34,
          $35, $36, $37, $38, $39, $40
        ) ON CONFLICT (fpl_id) DO UPDATE SET
          first_name = $2, second_name = $3, team_code = $4, position_id = $5,
          now_cost = $6, total_points = $7, form = $8, points_per_game = $9,
          value_form = $10, value_season = $11, selected_by_percent = $12, minutes = $13,
          goals_scored = $14, assists = $15, clean_sheets = $16, goals_conceded = $17,
          own_goals = $18, penalties_saved = $19, penalties_missed = $20, yellow_cards = $21,
          red_cards = $22, saves = $23, bonus = $24, influence = $25, creativity = $26,
          threat = $27, ict_index = $28, defensive_contribution = $29, starts = $30,
          expected_goals = $31, expected_assists = $32, expected_goal_involvements = $33,
          expected_goals_conceded = $34, expected_goals_per_90 = $35, saves_per_90 = $36,
          expected_assists_per_90 = $37, expected_goals_conceded_per_90 = $38,
          goals_conceded_per_90 = $39, clean_sheets_per_90 = $40, last_updated = CURRENT_TIMESTAMP
        `,
        [
          player.id, player.first_name, player.second_name, player.team_code, player.element_type,
          player.now_cost, player.total_points, player.form, player.points_per_game, player.value_form,
          player.value_season, player.selected_by_percent, player.minutes, player.goals_scored,
          player.assists, player.clean_sheets, player.goals_conceded, player.own_goals,
          player.penalties_saved, player.penalties_missed, player.yellow_cards, player.red_cards,
          player.saves, player.bonus, player.influence, player.creativity, player.threat,
          player.ict_index, player.defensive_contribution, player.starts, player.expected_goals,
          player.expected_assists, player.expected_goal_involvements, player.expected_goals_conceded,
          player.expected_goals_per_90, player.saves_per_90, player.expected_assists_per_90,
          player.expected_goals_conceded_per_90, player.goals_conceded_per_90, player.clean_sheets_per_90
        ]
      );
    }
    
    client.release();
    tempPool.end();
    res.json({ message: 'FPL data stored successfully', count: req.body.elements.length });
  } catch (error) {
    console.error('Error storing FPL data:', error);
    res.status(500).json({ error: 'Failed to store FPL data' });
  }
});

// Manual FPL data refresh endpoint
app.post('/api/refresh-fpl-data', async (req, res) => {
  try {
    console.log('🔄 Manual FPL data refresh requested...');
    await refreshFPLData();
    res.json({ message: 'FPL data refresh completed successfully' });
  } catch (error) {
    console.error('Error during manual FPL data refresh:', error);
    res.status(500).json({ error: 'Failed to refresh FPL data' });
  }
});

// Get historical data for a specific player
app.get('/api/player-history/:fplId', async (req, res) => {
  try {
    const fplId = parseInt(req.params.fplId);
    
    // Use the same SSL configuration as initialization
    const tempPool = new Pool({
      connectionString: process.env.DATABASE_URL.replace('?sslmode=require', ''),
      ssl: false
    });
    
    const client = await tempPool.connect();
    
    const result = await client.query(`
      SELECT 
        p.*,
        t.name as team_name,
        t.short_name as team_short_name,
        pos.singular_name as position_name
      FROM cursor.players p
      LEFT JOIN cursor.teams t ON p.team_code = t.team_code
      LEFT JOIN cursor.positions pos ON p.position_id = pos.position_id
      WHERE p.fpl_id = $1
      ORDER BY p.last_updated DESC
    `, [fplId]);
    
    client.release();
    tempPool.end();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    res.json({
      player_info: {
        fpl_id: result.rows[0].fpl_id,
        name: `${result.rows[0].first_name} ${result.rows[0].second_name}`,
        current_team: result.rows[0].team_name,
        position: result.rows[0].position_name
      },
      history: result.rows,
      total_records: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching player history:', error);
    res.status(500).json({ error: 'Failed to fetch player history' });
  }
});

// Get available gameweeks
app.get('/api/gameweeks', async (req, res) => {
  try {
    const tempPool = new Pool({
      connectionString: process.env.DATABASE_URL.replace('?sslmode=require', ''),
      ssl: false
    });
    const client = await tempPool.connect();
    const result = await client.query(`
      SELECT * FROM cursor.gameweeks 
      ORDER BY gameweek_id ASC
    `);
    client.release();
    tempPool.end();
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching gameweeks:', error);
    res.status(500).json({ error: 'Failed to fetch gameweeks' });
  }
});

// Get stored FPL data from database (latest data only - for Summary tab)
app.get('/api/stored-fpl-data', async (req, res) => {
  try {
    const tempPool = new Pool({
      connectionString: process.env.DATABASE_URL.replace('?sslmode=require', ''),
      ssl: false
    });
    
    const client = await tempPool.connect();
    
    const result = await client.query(`
      SELECT 
        p.*,
        t.name as team_name,
        t.short_name as team_short_name,
        pos.singular_name as position_name
      FROM cursor.players p
      LEFT JOIN cursor.teams t ON p.team_code = t.team_code
      LEFT JOIN cursor.positions pos ON p.position_id = pos.position_id
      WHERE p.last_updated = (
        SELECT MAX(last_updated) 
        FROM cursor.players p2 
        WHERE p2.fpl_id = p.fpl_id
      )
      ORDER BY p.total_points DESC
    `);
    
    client.release();
    tempPool.end();
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching stored FPL data:', error);
    res.status(500).json({ error: 'Failed to fetch stored FPL data' });
  }
});

// Get gameweek-specific FPL data (for Details tab)
app.get('/api/gameweek-fpl-data', async (req, res) => {
  try {
    const { gameweek } = req.query;
    const tempPool = new Pool({
      connectionString: process.env.DATABASE_URL.replace('?sslmode=require', ''),
      ssl: false
    });
    
    const client = await tempPool.connect();
    
    let query = `
      SELECT 
        gp.*,
        t.name as team_name,
        t.short_name as team_short_name,
        pos.singular_name as position_name,
        g.name as gameweek_name
      FROM cursor.gameweek_players gp
      LEFT JOIN cursor.teams t ON gp.team_code = t.team_code
      LEFT JOIN cursor.positions pos ON gp.position_id = pos.position_id
      LEFT JOIN cursor.gameweeks g ON gp.gameweek_id = g.gameweek_id
    `;
    
    let params = [];
    
    if (gameweek) {
      query += ` WHERE gp.gameweek_id = $1`;
      params.push(parseInt(gameweek));
    }
    
    query += ` ORDER BY gp.total_points DESC`;
    
    const result = await client.query(query, params);
    
    client.release();
    tempPool.end();
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching gameweek FPL data:', error);
    res.status(500).json({ error: 'Failed to fetch gameweek FPL data' });
  }
});

// Get data refresh status
app.get('/api/data-status', async (req, res) => {
  try {
    // Use the same SSL configuration as initialization
    const tempPool = new Pool({
      connectionString: process.env.DATABASE_URL.replace('?sslmode=require', ''),
      ssl: false
    });
    
    const client = await tempPool.connect();
    
    // Get count of players and last update time
    const playerCount = await client.query('SELECT COUNT(*) as count FROM cursor.players');
    const lastUpdate = await client.query('SELECT MAX(last_updated) as last_updated FROM cursor.players');
    const teamCount = await client.query('SELECT COUNT(*) as count FROM cursor.teams');
    
    client.release();
    tempPool.end();
    
    res.json({
      player_count: parseInt(playerCount.rows[0].count),
      team_count: parseInt(teamCount.rows[0].count),
      last_updated: lastUpdate.rows[0].last_updated,
      next_scheduled_refresh: 'Every Tuesday at 12:01 AM IST',
      timezone: 'Asia/Kolkata'
    });
  } catch (error) {
    console.error('Error fetching data status:', error);
    res.status(500).json({ error: 'Failed to fetch data status' });
  }
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    // Use the same SSL configuration as initialization
    const tempPool = new Pool({
      connectionString: process.env.DATABASE_URL.replace('?sslmode=require', ''),
      ssl: false
    });
    
    const client = await tempPool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    client.release();
    tempPool.end();
    
    res.json({ 
      message: 'Database connection successful', 
      timestamp: result.rows[0].current_time 
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Initialize database on startup
initializeDatabase();

// Automated FPL data refresh function
async function refreshFPLData() {
  try {
    console.log('🔄 Starting automated FPL data refresh...');
    
    // Fetch fresh data from FPL API
    const response = await axios.get(process.env.FPL_API_URL);
    const fplData = response.data;
    
    // Use the same SSL configuration as initialization
    const tempPool = new Pool({
      connectionString: process.env.DATABASE_URL.replace('?sslmode=require', ''),
      ssl: false
    });
    
    const client = await tempPool.connect();
    
    // Clear existing data
    await client.query('DELETE FROM cursor.players');
    await client.query('DELETE FROM cursor.gameweek_players');
    await client.query('DELETE FROM cursor.teams');
    await client.query('DELETE FROM cursor.positions');
    await client.query('DELETE FROM cursor.gameweeks');
    
    // Insert gameweeks
    for (const event of fplData.events) {
      await client.query(
        'INSERT INTO cursor.gameweeks (gameweek_id, name, deadline_time, is_current, is_next, is_previous, finished) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (gameweek_id) DO UPDATE SET name = $2, deadline_time = $3, is_current = $4, is_next = $5, is_previous = $6, finished = $7',
        [event.id, event.name, event.deadline_time, event.is_current, event.is_next, event.is_previous, event.finished]
      );
    }
    
    // Insert teams
    for (const team of fplData.teams) {
      await client.query(
        'INSERT INTO cursor.teams (team_code, name, short_name) VALUES ($1, $2, $3) ON CONFLICT (team_code) DO UPDATE SET name = $2, short_name = $3',
        [team.code, team.name, team.short_name]
      );
    }
    
    // Insert positions
    for (const position of fplData.element_types) {
      await client.query(
        'INSERT INTO cursor.positions (position_id, singular_name, plural_name) VALUES ($1, $2, $3) ON CONFLICT (position_id) DO UPDATE SET singular_name = $2, plural_name = $3',
        [position.id, position.singular_name, position.plural_name]
      );
    }
    
    // Find current gameweek
    const currentGameweek = fplData.events.find(event => event.is_current) || fplData.events.find(event => event.is_next) || fplData.events[0];
    const gameweekId = currentGameweek ? currentGameweek.id : 1;
    
    // Insert players into both tables
    for (const player of fplData.elements) {
      // Insert into summary table (players)
      await client.query(`
        INSERT INTO cursor.players (
          fpl_id, first_name, second_name, team_code, position_id, now_cost, total_points,
          form, points_per_game, value_form, value_season, selected_by_percent, minutes,
          goals_scored, assists, clean_sheets, goals_conceded, own_goals, penalties_saved,
          penalties_missed, yellow_cards, red_cards, saves, bonus, influence, creativity,
          threat, ict_index, defensive_contribution, starts, expected_goals, expected_assists,
          expected_goal_involvements, expected_goals_conceded, expected_goals_per_90,
          saves_per_90, expected_assists_per_90, expected_goals_conceded_per_90,
          goals_conceded_per_90, clean_sheets_per_90
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
          $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34,
          $35, $36, $37, $38, $39, $40
        )
        `,
        [
          player.id, player.first_name, player.second_name, player.team_code, player.element_type,
          player.now_cost, player.total_points, player.form, player.points_per_game, player.value_form,
          player.value_season, player.selected_by_percent, player.minutes, player.goals_scored,
          player.assists, player.clean_sheets, player.goals_conceded, player.own_goals,
          player.penalties_saved, player.penalties_missed, player.yellow_cards, player.red_cards,
          player.saves, player.bonus, player.influence, player.creativity, player.threat,
          player.ict_index, player.defensive_contribution, player.starts, player.expected_goals,
          player.expected_assists, player.expected_goal_involvements, player.expected_goals_conceded,
          player.expected_goals_per_90, player.saves_per_90, player.expected_assists_per_90,
          player.expected_goals_conceded_per_90, player.goals_conceded_per_90, player.clean_sheets_per_90
        ]
      );
      
      // Insert into gameweek-specific table (gameweek_players)
      await client.query(`
        INSERT INTO cursor.gameweek_players (
          fpl_id, gameweek_id, first_name, second_name, team_code, position_id, now_cost, total_points,
          form, points_per_game, value_form, value_season, selected_by_percent, minutes,
          goals_scored, assists, clean_sheets, goals_conceded, own_goals, penalties_saved,
          penalties_missed, yellow_cards, red_cards, saves, bonus, influence, creativity,
          threat, ict_index, defensive_contribution, starts, expected_goals, expected_assists,
          expected_goal_involvements, expected_goals_conceded, expected_goals_per_90,
          saves_per_90, expected_assists_per_90, expected_goals_conceded_per_90,
          goals_conceded_per_90, clean_sheets_per_90
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
          $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34,
          $35, $36, $37, $38, $39, $40, $41
        )
        `,
        [
          player.id, gameweekId, player.first_name, player.second_name, player.team_code, player.element_type,
          player.now_cost, player.total_points, player.form, player.points_per_game, player.value_form,
          player.value_season, player.selected_by_percent, player.minutes, player.goals_scored,
          player.assists, player.clean_sheets, player.goals_conceded, player.own_goals,
          player.penalties_saved, player.penalties_missed, player.yellow_cards, player.red_cards,
          player.saves, player.bonus, player.influence, player.creativity, player.threat,
          player.ict_index, player.defensive_contribution, player.starts, player.expected_goals,
          player.expected_assists, player.expected_goal_involvements, player.expected_goals_conceded,
          player.expected_goals_per_90, player.saves_per_90, player.expected_assists_per_90,
          player.expected_goals_conceded_per_90, player.goals_conceded_per_90, player.clean_sheets_per_90
        ]
      );
    }
    
    client.release();
    tempPool.end();
    
    console.log(`✅ FPL data refresh completed successfully! Updated ${fplData.elements.length} players at ${new Date().toISOString()}`);
  } catch (error) {
    console.error('❌ Error during automated FPL data refresh:', error);
  }
}

// Schedule FPL data refresh every Tuesday at 12:01 AM IST (6:31 PM UTC Monday)
// Cron format: minute hour day month day-of-week
// IST is UTC+5:30, so 12:01 AM IST = 6:31 PM UTC (previous day)
cron.schedule('31 18 * * 1', () => {
  refreshFPLData();
}, {
  scheduled: true,
  timezone: "Asia/Kolkata"
});

console.log('⏰ Scheduled FPL data refresh: Every Tuesday at 12:01 AM IST');

app.listen(PORT, () => {
  console.log(`🚀 FPL Server running on http://localhost:${PORT}`);
  console.log(`📊 Database connected successfully`);
}); 