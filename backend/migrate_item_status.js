/**
 * Migration Script: Add item_status field to existing items
 * 
 * This script updates all existing items in the database to include
 * the new item_status field based on their current sold status.
 * 
 * Run this once after deploying the backend changes.
 */

const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://campusmart:suba%401401@cluster0.k8zcvfn.mongodb.net/campusmart?retryWrites=true&w=majority&appName=Cluster0';

async function migrateItemStatus() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const itemsCollection = db.collection('items');

    // Count items that need migration
    const totalItems = await itemsCollection.countDocuments();
    const itemsWithoutStatus = await itemsCollection.countDocuments({ 
      item_status: { $exists: false } 
    });

    console.log(`📊 Total items in database: ${totalItems}`);
    console.log(`📊 Items without item_status: ${itemsWithoutStatus}\n`);

    if (itemsWithoutStatus === 0) {
      console.log('✅ All items already have item_status field. No migration needed.');
      await mongoose.connection.close();
      return;
    }

    // Update sold items to have item_status: 'Sold'
    console.log('🔄 Updating sold items...');
    const soldResult = await itemsCollection.updateMany(
      { 
        sold: true, 
        item_status: { $exists: false } 
      },
      { 
        $set: { item_status: 'Sold' } 
      }
    );
    console.log(`✅ Updated ${soldResult.modifiedCount} sold items to status 'Sold'`);

    // Update available items to have item_status: 'Available'
    console.log('🔄 Updating available items...');
    const availableResult = await itemsCollection.updateMany(
      { 
        $or: [
          { sold: false },
          { sold: { $exists: false } }
        ],
        item_status: { $exists: false } 
      },
      { 
        $set: { item_status: 'Available' } 
      }
    );
    console.log(`✅ Updated ${availableResult.modifiedCount} available items to status 'Available'`);

    // Verify migration
    console.log('\n🔍 Verifying migration...');
    const remainingWithoutStatus = await itemsCollection.countDocuments({ 
      item_status: { $exists: false } 
    });
    
    const statusCounts = await itemsCollection.aggregate([
      { $group: { _id: '$item_status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();

    console.log('\n📊 Final Status Distribution:');
    statusCounts.forEach(status => {
      console.log(`   ${status._id || 'null'}: ${status.count} items`);
    });

    if (remainingWithoutStatus === 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log(`   Total items migrated: ${soldResult.modifiedCount + availableResult.modifiedCount}`);
    } else {
      console.log(`\n⚠️  Warning: ${remainingWithoutStatus} items still without item_status`);
    }

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
console.log('🚀 Starting item_status migration...\n');
migrateItemStatus();
