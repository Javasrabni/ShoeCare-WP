/**
 * Migration: Fix email unique index to be sparse
 * 
 * This script:
 * 1. Cleans up duplicate null emails
 * 2. Drops the existing unique index on email
 * 3. Creates a new sparse unique index
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URL = process.env.MONGODB_URL;

async function runMigration() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URL);
    console.log("✅ Connected");

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Step 1: Find users with duplicate null emails (keep one, delete others)
    console.log("\n🧹 Cleaning up duplicate null emails...");
    const usersWithNullEmail = await usersCollection.find({ email: null }).toArray();
    console.log(`Found ${usersWithNullEmail.length} users with email: null`);

    if (usersWithNullEmail.length > 1) {
      // Keep the first one, delete the rest
      const duplicateIds = usersWithNullEmail.slice(1).map(u => u._id);
      
      if (duplicateIds.length > 0) {
        const deleteResult = await usersCollection.deleteMany({
          _id: { $in: duplicateIds }
        });
        console.log(`Deleted ${deleteResult.deletedCount} duplicate users with null email`);
      }
    }

    // Step 2: Drop existing unique index on email
    console.log("\n🔧 Dropping existing email index...");
    try {
      await usersCollection.dropIndex("email_1");
      console.log("✅ Dropped index: email_1");
    } catch (err) {
      if (err.code === 27 || err.code === 4) { // IndexNotFound or NamespaceNotFound
        console.log("⚠️  Index didn't exist or already dropped");
      } else {
        throw err;
      }
    }

    // Step 3: Create sparse unique index
    console.log("\n🔧 Creating sparse unique index on email...");
    await usersCollection.createIndex(
      { email: 1 },
      { 
        unique: true,
        sparse: true,
        background: true 
      }
    );
    console.log("✅ Created sparse unique index on email");

    // Step 4: Verify
    const indexes = await usersCollection.indexes();
    console.log("\n📋 Current indexes:");
    indexes.forEach((idx) => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)} ${idx.unique ? '(unique)' : ''} ${idx.sparse ? '(sparse)' : ''}`);
    });

    console.log("\n✅ Migration completed successfully!");
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected");
  }
}

runMigration();
