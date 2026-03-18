db = db.getSiblingDB('elevate-offsites');

// Create collections
db.createCollection('conversations');
db.createCollection('leads');
db.createCollection('token_usage');
db.createCollection('content');

// Conversations indexes
db.conversations.createIndex({ sessionId: 1 }, { unique: true });
db.conversations.createIndex({ createdAt: -1 });
db.conversations.createIndex({ leadCaptured: 1, createdAt: -1 });
db.conversations.createIndex(
  { 'metadata.lastMessageAt': 1 },
  { expireAfterSeconds: 7776000 }
);

// Leads indexes
db.leads.createIndex({ email: 1 });
db.leads.createIndex({ createdAt: -1 });
db.leads.createIndex({ sessionId: 1 });

// Token usage indexes
db.token_usage.createIndex({ date: 1 }, { unique: true });
db.token_usage.createIndex(
  { updatedAt: 1 },
  { expireAfterSeconds: 7776000 }
);

// Content indexes
db.content.createIndex({ key: 1 }, { unique: true });

print('✓ Database initialized with collections and indexes');
