import { MongoClient, ObjectId } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/elevate-offsites';

function randomDate(daysAgo: number): Date {
  const now = new Date();
  const offset = Math.floor(Math.random() * daysAgo * 24 * 60 * 60 * 1000);
  return new Date(now.getTime() - offset);
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

const FAKE_CONVERSATIONS = [
  {
    sessionId: 'seed-session-001',
    messages: [
      { role: 'assistant' as const, content: 'Welcome to Elevate Offsites! Are you planning a corporate retreat, or just exploring what we offer?', timestamp: new Date(), tokens: { prompt: 5200, completion: 24, total: 5224 } },
      { role: 'user' as const, content: 'We have a team of 25 and want to do something outdoors.', timestamp: new Date(), tokens: null },
      { role: 'assistant' as const, content: 'Great to hear! For a group of 25, our **Nature Package** would be an excellent fit.\n\nIt includes a scenic venue, full catering, round-trip transport, and a guided team-building activity - all at **$450 per person**.\n\nFor 25 people, that comes to 25 × $450 = **$11,250**.\n\nDo you have a timeframe in mind?', timestamp: new Date(), tokens: { prompt: 5500, completion: 85, total: 5585 } },
      { role: 'user' as const, content: 'Looking at Q3 this year. Maybe August.', timestamp: new Date(), tokens: null },
      { role: 'assistant' as const, content: 'August is a popular month for the Hill Country venues - I\'d recommend booking soon to lock in availability.\n\nWould you like me to have our events team put together a tailored proposal? I\'d just need the best email to send it to.', timestamp: new Date(), tokens: { prompt: 5800, completion: 55, total: 5855 } },
      { role: 'user' as const, content: 'Sure, send it to sarah@acmecorp.com', timestamp: new Date(), tokens: null },
      { role: 'assistant' as const, content: 'I\'ve noted that down. Our team will be in touch at **sarah@acmecorp.com** within 24 hours with a personalized proposal for your August retreat.\n\nIs there anything else I can help with?', timestamp: new Date(), tokens: { prompt: 6100, completion: 48, total: 6148 } },
    ],
    totalTokens: { prompt: 22600, completion: 212, total: 22812 },
    messageCount: 7,
    leadCaptured: true,
    status: 'completed' as const,
    metadata: { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', ip: 'seed', startedAt: randomDate(3), lastMessageAt: new Date(), provider: 'gemini' as const },
  },
  {
    sessionId: 'seed-session-002',
    messages: [
      { role: 'assistant' as const, content: 'Welcome to Elevate Offsites! Are you planning a corporate retreat, or just exploring what we offer?', timestamp: new Date(), tokens: { prompt: 5200, completion: 24, total: 5224 } },
      { role: 'user' as const, content: 'What packages do you offer?', timestamp: new Date(), tokens: null },
      { role: 'assistant' as const, content: 'We offer three packages:\n\n- **Urban Package** - $300/person. Downtown venues, full catering, AV equipment. Great for workshops and strategic planning.\n- **Nature Package** - $450/person. Scenic venues, catering, transport, and a guided activity. Perfect for team bonding.\n- **Executive Package** - $15,000 flat rate for up to 15 people. Luxury estate, private chef, premium bar, bespoke itinerary.\n\nWhat kind of event are you planning?', timestamp: new Date(), tokens: { prompt: 5300, completion: 95, total: 5395 } },
      { role: 'user' as const, content: 'Just browsing for now, thanks!', timestamp: new Date(), tokens: null },
      { role: 'assistant' as const, content: 'No problem at all! Feel free to come back anytime. I\'m here whenever you\'re ready to start planning.', timestamp: new Date(), tokens: { prompt: 5600, completion: 28, total: 5628 } },
    ],
    totalTokens: { prompt: 16100, completion: 147, total: 16247 },
    messageCount: 5,
    leadCaptured: false,
    status: 'completed' as const,
    metadata: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', ip: 'seed', startedAt: randomDate(2), lastMessageAt: new Date(), provider: 'gemini' as const },
  },
  {
    sessionId: 'seed-session-003',
    messages: [
      { role: 'assistant' as const, content: 'Welcome to Elevate Offsites! Are you planning a corporate retreat, or just exploring what we offer?', timestamp: new Date(), tokens: { prompt: 5200, completion: 24, total: 5224 } },
      { role: 'user' as const, content: 'We need a retreat for 80 people. What\'s the budget look like?', timestamp: new Date(), tokens: null },
      { role: 'assistant' as const, content: 'For a group of 80, here are the options:\n\n- **Urban Package**: 80 × $300 = **$24,000**\n- **Nature Package**: 80 × $450 = **$36,000**\n\nThe **Executive Package** is limited to 15 people, so it wouldn\'t be the right fit for this group size.\n\nWhich style of retreat resonates more with your team - urban workshops or outdoor bonding?', timestamp: new Date(), tokens: { prompt: 5400, completion: 90, total: 5490 } },
      { role: 'user' as const, content: 'Urban sounds good. Can we customize it?', timestamp: new Date(), tokens: null },
      { role: 'assistant' as const, content: 'All packages can be customized with add-ons such as additional activities, extended stays, branded materials, or guest speakers.\n\nOur events team can put together a detailed quote for add-ons. Would you like me to connect you? I\'d just need your email address.', timestamp: new Date(), tokens: { prompt: 5700, completion: 55, total: 5755 } },
    ],
    totalTokens: { prompt: 16300, completion: 169, total: 16469 },
    messageCount: 5,
    leadCaptured: false,
    status: 'active' as const,
    metadata: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', ip: 'seed', startedAt: randomDate(1), lastMessageAt: new Date(), provider: 'gemini' as const },
  },
  {
    sessionId: 'seed-session-004',
    messages: [
      { role: 'assistant' as const, content: 'Welcome to Elevate Offsites! Are you planning a corporate retreat, or just exploring what we offer?', timestamp: new Date(), tokens: { prompt: 5200, completion: 24, total: 5224 } },
      { role: 'user' as const, content: 'Hi, I\'m looking for something special for our executive leadership - 10 people.', timestamp: new Date(), tokens: null },
      { role: 'assistant' as const, content: 'Our **Executive Package** sounds like a perfect match. It\'s a premium experience for up to 15 people at a **$15,000 flat rate**.\n\nIt includes a luxury private estate, private chef, premium bar, VIP transport, and a fully bespoke itinerary.\n\nDo you have a preferred region? We offer executive venues in the Colorado Rockies and Coastal Southeast.', timestamp: new Date(), tokens: { prompt: 5400, completion: 78, total: 5478 } },
      { role: 'user' as const, content: 'Colorado sounds amazing. My email is james.chen@techventures.io', timestamp: new Date(), tokens: null },
      { role: 'assistant' as const, content: 'Excellent choice. I\'ve noted your details. Our events team will reach out to **james.chen@techventures.io** within 24 hours with options for our Colorado Rockies executive venues.\n\nIs there anything specific you\'d like included in the proposal?', timestamp: new Date(), tokens: { prompt: 5800, completion: 52, total: 5852 } },
      { role: 'user' as const, content: 'Include options for a wine tasting and maybe a private ski session if it\'s winter.', timestamp: new Date(), tokens: null },
      { role: 'assistant' as const, content: 'I\'ve made a note of that - wine tasting and private ski session options for a winter retreat. Our events team will incorporate both into your proposal.\n\nLooking forward to helping you create something memorable for your leadership team!', timestamp: new Date(), tokens: { prompt: 6100, completion: 45, total: 6145 } },
    ],
    totalTokens: { prompt: 22500, completion: 199, total: 22699 },
    messageCount: 7,
    leadCaptured: true,
    status: 'completed' as const,
    metadata: { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', ip: 'seed', startedAt: randomDate(5), lastMessageAt: new Date(), provider: 'gemini' as const },
  },
  {
    sessionId: 'seed-session-005',
    messages: [
      { role: 'assistant' as const, content: 'Welcome to Elevate Offsites! Are you planning a corporate retreat, or just exploring what we offer?', timestamp: new Date(), tokens: { prompt: 5200, completion: 24, total: 5224 } },
      { role: 'user' as const, content: 'How far in advance do I need to book?', timestamp: new Date(), tokens: null },
      { role: 'assistant' as const, content: 'Great question! Here are our recommended lead times:\n\n- **Urban Package**: at least 6 weeks\n- **Nature Package**: at least 8 weeks\n- **Executive Package**: at least 12 weeks\n\nTighter timelines may be possible depending on venue availability. Do you have an event in mind?', timestamp: new Date(), tokens: { prompt: 5300, completion: 65, total: 5365 } },
    ],
    totalTokens: { prompt: 10500, completion: 89, total: 10589 },
    messageCount: 3,
    leadCaptured: false,
    status: 'active' as const,
    metadata: { userAgent: 'Mozilla/5.0 (Linux; Android 14)', ip: 'seed', startedAt: randomDate(1), lastMessageAt: new Date(), provider: 'gemini' as const },
  },
];

const FAKE_LEADS = [
  {
    sessionId: 'seed-session-001',
    email: 'sarah@acmecorp.com',
    name: 'Sarah',
    companyName: 'Acme Corp',
    estimatedHeadcount: 25,
    budgetRange: '$10,000-$15,000',
    eventType: 'Nature Package',
    notes: 'Interested in Hill Country venue for August Q3 retreat',
    source: 'chatbot' as const,
    status: 'new' as const,
    createdAt: randomDate(3),
  },
  {
    sessionId: 'seed-session-004',
    email: 'james.chen@techventures.io',
    name: 'James Chen',
    companyName: 'TechVentures',
    estimatedHeadcount: 10,
    budgetRange: '$15,000',
    eventType: 'Executive Package',
    notes: 'Colorado Rockies executive retreat. Wants wine tasting and private ski session options.',
    source: 'chatbot' as const,
    status: 'new' as const,
    createdAt: randomDate(5),
  },
];

export async function seedDemoData(db: import('mongodb').Db) {
  // Seed conversations
  const convDocs = FAKE_CONVERSATIONS.map((conv) => {
    const leadId = FAKE_LEADS.find((l) => l.sessionId === conv.sessionId)
      ? new ObjectId()
      : null;
    return {
      ...conv,
      leadId,
      createdAt: conv.metadata.startedAt,
      updatedAt: new Date(),
    };
  });

  await db.collection('conversations').insertMany(convDocs);

  // Seed leads (link to conversation leadIds)
  const leadDocs = FAKE_LEADS.map((lead) => {
    const conv = convDocs.find((c) => c.sessionId === lead.sessionId);
    return {
      ...lead,
      _id: conv?.leadId || new ObjectId(),
    };
  });

  await db.collection('leads').insertMany(leadDocs);

  // Seed today's token usage
  const totalTokens = FAKE_CONVERSATIONS.reduce(
    (sum, c) => sum + c.totalTokens.total,
    0
  );
  const totalInput = FAKE_CONVERSATIONS.reduce(
    (sum, c) => sum + c.totalTokens.prompt,
    0
  );
  const totalOutput = FAKE_CONVERSATIONS.reduce(
    (sum, c) => sum + c.totalTokens.completion,
    0
  );

  await db.collection('token_usage').updateOne(
    { date: todayString() },
    {
      $set: {
        totalRequests: FAKE_CONVERSATIONS.length,
        totalInputTokens: totalInput,
        totalOutputTokens: totalOutput,
        totalTokens: totalTokens,
        requestsByHour: { '10': 2, '11': 1, '14': 2 },
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );

  // Seed knowledge base content
  const kbPath = path.join(process.cwd(), 'content', 'knowledge-base.md');
  const kbContent = fs.readFileSync(kbPath, 'utf-8');

  await db.collection('content').updateOne(
    { key: 'knowledge-base' },
    {
      $set: {
        content: kbContent,
        tokenCount: Math.ceil(kbContent.length / 4), // rough estimate
        version: 1,
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );

  return { conversations: convDocs.length, leads: leadDocs.length };
}

async function main() {
  console.log('Connecting to MongoDB...');
  const client = new MongoClient(MONGODB_URI);
  await client.connect();

  const dbName = new URL(MONGODB_URI).pathname.slice(1) || 'elevate-offsites';
  const db = client.db(dbName);

  console.log('Seeding demo data...');
  const result = await seedDemoData(db);
  console.log(`✓ Seeded ${result.conversations} conversations and ${result.leads} leads`);

  await client.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
