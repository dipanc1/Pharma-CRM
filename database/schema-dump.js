const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

const BACKUP_DIR = path.join(__dirname, 'backups');

const CONNECTION_STRING = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

const MISSING_URL_HELP = `DATABASE_URL is not set, so the live schema cannot be read.

  1. Supabase dashboard -> Settings -> Database -> Connection string -> URI
  2. Add it to .env as:  DATABASE_URL=postgresql://postgres:...
  3. Do NOT prefix it with REACT_APP_ -- that would ship your database
     password to every visitor in the browser bundle.`;

const COLUMNS_SQL = `
  SELECT c.relname                                  AS table_name,
         a.attname                                  AS column_name,
         format_type(a.atttypid, a.atttypmod)       AS data_type,
         a.attnotnull                               AS not_null,
         pg_get_expr(d.adbin, d.adrelid)            AS default_value
    FROM pg_attribute a
    JOIN pg_class     c ON c.oid = a.attrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    LEFT JOIN pg_attrdef d ON d.adrelid = c.oid AND d.adnum = a.attnum
   WHERE n.nspname = 'public'
     AND c.relkind = 'r'
     AND a.attnum > 0
     AND NOT a.attisdropped
   ORDER BY c.relname, a.attnum;`;

const TABLES_SQL = `
  SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public' AND c.relkind = 'r'
   ORDER BY c.relname;`;

const CONSTRAINTS_SQL = `
  SELECT rel.relname                    AS table_name,
         con.conname                    AS name,
         con.contype                    AS type,
         pg_get_constraintdef(con.oid)  AS definition
    FROM pg_constraint con
    JOIN pg_class     rel ON rel.oid = con.conrelid
    JOIN pg_namespace n   ON n.oid = rel.relnamespace
   WHERE n.nspname = 'public'
   ORDER BY rel.relname, con.contype, con.conname;`;

const INDEXES_SQL = `
  SELECT tablename AS table_name, indexname AS name, indexdef AS definition
    FROM pg_indexes
   WHERE schemaname = 'public'
   ORDER BY tablename, indexname;`;

const POLICIES_SQL = `
  SELECT tablename AS table_name, policyname AS name, permissive,
         roles, cmd, qual, with_check
    FROM pg_policies
   WHERE schemaname = 'public'
   ORDER BY tablename, policyname;`;

const TRIGGERS_SQL = `
  SELECT rel.relname               AS table_name,
         tg.tgname                 AS name,
         pg_get_triggerdef(tg.oid) AS definition
    FROM pg_trigger   tg
    JOIN pg_class     rel ON rel.oid = tg.tgrelid
    JOIN pg_namespace n   ON n.oid = rel.relnamespace
   WHERE n.nspname = 'public' AND NOT tg.tgisinternal
   ORDER BY rel.relname, tg.tgname;`;

const FUNCTIONS_SQL = `
  SELECT p.proname                 AS name,
         pg_get_functiondef(p.oid) AS definition
    FROM pg_proc      p
    JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.prokind = 'f'
   ORDER BY p.proname;`;

const CONSTRAINT_LABELS = { p: 'PRIMARY KEY', f: 'FOREIGN KEY', u: 'UNIQUE', c: 'CHECK', x: 'EXCLUDE' };

function groupBy(rows, key) {
    return rows.reduce((acc, row) => {
        (acc[row[key]] = acc[row[key]] || []).push(row);
        return acc;
    }, {});
}

async function introspect() {
    if (!CONNECTION_STRING) {
        const error = new Error(MISSING_URL_HELP);
        error.code = 'NO_DATABASE_URL';
        throw error;
    }

    const client = new Client({
        connectionString: CONNECTION_STRING,
        ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    try {
        const [tables, columns, constraints, indexes, policies, triggers, functions] = await Promise.all([
            client.query(TABLES_SQL),
            client.query(COLUMNS_SQL),
            client.query(CONSTRAINTS_SQL),
            client.query(INDEXES_SQL),
            client.query(POLICIES_SQL),
            client.query(TRIGGERS_SQL),
            client.query(FUNCTIONS_SQL)
        ]);

        return {
            generated_at: new Date().toISOString(),
            tables: tables.rows,
            columns: columns.rows,
            constraints: constraints.rows,
            indexes: indexes.rows,
            policies: policies.rows,
            triggers: triggers.rows,
            functions: functions.rows
        };
    } finally {
        await client.end();
    }
}

function render(schema) {
    const columnsByTable = groupBy(schema.columns, 'table_name');
    const constraintsByTable = groupBy(schema.constraints, 'table_name');
    const indexesByTable = groupBy(schema.indexes, 'table_name');
    const policiesByTable = groupBy(schema.policies, 'table_name');
    const triggersByTable = groupBy(schema.triggers, 'table_name');

    const lines = [
        '-- LIVE DATABASE SCHEMA',
        `-- Read directly from Postgres: ${schema.generated_at}`,
        '--',
        '-- A report of what the database actually contains, not a migration.',
        '-- Use migrations_combined_*.sql to rebuild from scratch.',
        ''
    ];

    schema.tables.forEach(table => {
        const name = table.table_name;
        const columns = columnsByTable[name] || [];
        const constraints = constraintsByTable[name] || [];
        const policies = policiesByTable[name] || [];
        const triggers = triggersByTable[name] || [];
        const indexes = indexesByTable[name] || [];

        lines.push('-'.repeat(70));
        lines.push(`TABLE ${name}`);
        lines.push('-'.repeat(70));

        const width = Math.max(...columns.map(c => c.column_name.length), 4);
        const typeWidth = Math.max(...columns.map(c => c.data_type.length), 4);

        columns.forEach(column => {
            const nullability = column.not_null ? 'NOT NULL' : 'NULL    ';
            const dflt = column.default_value ? `  default ${column.default_value}` : '';
            lines.push(`  ${column.column_name.padEnd(width)}  ${column.data_type.padEnd(typeWidth)}  ${nullability}${dflt}`);
        });

        if (constraints.length) {
            lines.push('');
            constraints.forEach(c => {
                lines.push(`  ${CONSTRAINT_LABELS[c.type] || c.type}  ${c.name}`);
                lines.push(`    ${c.definition}`);
            });
        }

        lines.push('');
        lines.push(`  RLS: ${table.rls_enabled ? 'ENABLED' : 'disabled'}`);

        if (table.rls_enabled && policies.length === 0) {
            lines.push('  !! RLS is enabled but this table has NO POLICIES.');
            lines.push('  !! Every query against it is denied except via service_role.');
        }

        policies.forEach(p => {
            lines.push(`  POLICY ${p.name}  [${p.cmd}]  roles=${p.roles}  ${p.permissive === 'PERMISSIVE' ? '' : '(restrictive)'}`);
            if (p.qual) lines.push(`    USING ${p.qual}`);
            if (p.with_check) lines.push(`    WITH CHECK ${p.with_check}`);
        });

        if (triggers.length) {
            lines.push('');
            triggers.forEach(t => lines.push(`  TRIGGER ${t.name}\n    ${t.definition}`));
        }

        if (indexes.length) {
            lines.push('');
            indexes.forEach(i => lines.push(`  INDEX ${i.definition}`));
        }

        lines.push('');
    });

    if (schema.functions.length) {
        lines.push('='.repeat(70));
        lines.push('FUNCTIONS');
        lines.push('='.repeat(70));
        lines.push('');
        schema.functions.forEach(fn => {
            lines.push(fn.definition.trim());
            lines.push('');
        });
    }

    return lines.join('\n');
}

async function dumpLiveSchema() {
    const schema = await introspect();

    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const file = path.join(BACKUP_DIR, `live_schema_${timestamp}.sql`);
    fs.writeFileSync(file, render(schema));

    return { file: path.basename(file), path: file, schema };
}

if (require.main === module) {
    dumpLiveSchema()
        .then(({ path: file, schema }) => {
            const columnsByTable = groupBy(schema.columns, 'table_name');

            console.log('\n📋 Live schema read from Postgres\n');
            schema.tables.forEach(t => {
                const columns = columnsByTable[t.table_name] || [];
                console.log(`   ${t.table_name.padEnd(26)} ${String(columns.length).padStart(2)} columns   ${columns.map(c => c.column_name).join(', ')}`);
            });

            const denyAll = schema.tables.filter(
                t => t.rls_enabled && !schema.policies.some(p => p.table_name === t.table_name)
            );

            if (denyAll.length) {
                console.log('\n⚠️  RLS enabled with NO policies (all access denied):');
                denyAll.forEach(t => console.log(`   - ${t.table_name}`));
            }

            console.log(`\n✅ Written to: ${file}\n`);
            process.exit(0);
        })
        .catch(error => {
            if (error.code === 'NO_DATABASE_URL') {
                console.error(`\n❌ ${error.message}\n`);
            } else {
                console.error('\n❌ Could not read the live schema:', error.message, '\n');
            }
            process.exit(1);
        });
}

module.exports = { dumpLiveSchema, introspect, render };
