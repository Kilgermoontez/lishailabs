const fs = require('fs');
const path = require('path');
const pool = require('./database');

async function initializeDatabase() {
  try {
    const schemaPath = path.join(__dirname, '../../sql/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semi-colon and filter empty statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    // Execute each statement
    for (const statement of statements) {
      try {
        await pool.execute(statement);
      } catch (error) {
        // Ignore table exists errors
        if (!error.message.includes('already exists')) {
          console.error('SQL Error:', error.message, '\nStatement:', statement);
        }
      }
    }
    
    console.log('✓ Database initialized successfully');
    
    // Seed test data if exists
    const seedPath = path.join(__dirname, '../../sql/seed_admin.sql');
    if (fs.existsSync(seedPath)) {
      const seedData = fs.readFileSync(seedPath, 'utf8');
      const seedStatements = seedData
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      for (const statement of seedStatements) {
        try {
          await pool.execute(statement);
        } catch (error) {
          console.error('Seed Error:', error.message);
        }
      }
      console.log('✓ Test data seeded');
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}

module.exports = { initializeDatabase };
