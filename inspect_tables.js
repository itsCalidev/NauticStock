const DB = require('./app/classes/db');

async function inspectTables() {
    const db = new DB('products');

    try {
        console.log('--- Products Table ---');
        const [products] = await db.execute('SHOW CREATE TABLE products');
        console.log(products['Create Table']);

        console.log('\n--- Providers Table ---');
        const [providers] = await db.execute('SHOW CREATE TABLE providers');
        console.log(providers['Create Table']);

        console.log('\n--- Users Table ---');
        const [users] = await db.execute('SHOW CREATE TABLE users');
        console.log(users['Create Table']);

    } catch (error) {
        console.error('❌ Error inspecting tables:', error);
    } finally {
        process.exit();
    }
}

inspectTables();
