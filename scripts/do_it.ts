import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import * as schema from '../lib/db/schema';
import 'dotenv/config';
import { analyzeSubscriptions } from '../lib/subscriptions/detect';
import crypto from 'crypto';

const run = async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });
  const db = drizzle(pool, { schema });
  const user = await db.query.user.findFirst({ where: eq(schema.user.email, 'meenasujal60@gmail.com') });
  
  if (user) {
    console.log('Clearing old subscriptions for', user.email);
    await db.delete(schema.subscriptions).where(eq(schema.subscriptions.userId, user.id));
    await db.delete(schema.subscriptionAlerts).where(eq(schema.subscriptionAlerts.userId, user.id));
    await db.delete(schema.receipts).where(eq(schema.receipts.userId, user.id));

    console.log('Running seed script manually...');
    const now = new Date();
    const receiptsToInsert: schema.NewReceipt[] = [];

    // AWS
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now); date.setMonth(date.getMonth() - i); date.setDate(5);
      receiptsToInsert.push({ id: crypto.randomUUID(), userId: user.id, source: 'gmail', receiptDate: date.toISOString().split('T')[0], amountCents: i === 0 ? 5500 : 4500, currency: 'USD', vendor: 'Amazon Web Services', vendorNormalized: 'amazon web services', category: 'hosting', extractedItems: [], subject: 'AWS Invoice', fromEmail: 'no-reply-aws@amazon.com' });
    }

    // Figma
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now); date.setMonth(date.getMonth() - i); date.setDate(12);
      receiptsToInsert.push({ id: crypto.randomUUID(), userId: user.id, source: 'gmail', receiptDate: date.toISOString().split('T')[0], amountCents: 1500, currency: 'USD', vendor: 'Figma', vendorNormalized: 'figma', category: 'software', extractedItems: [], subject: 'Your Figma receipt', fromEmail: 'billing@figma.com' });
    }

    // Framer
    for (let i = 3; i >= 0; i--) {
      const date = new Date(now); date.setMonth(date.getMonth() - i); date.setDate(1);
      receiptsToInsert.push({ id: crypto.randomUUID(), userId: user.id, source: 'gmail', receiptDate: date.toISOString().split('T')[0], amountCents: 2000, currency: 'EUR', vendor: 'Framer', vendorNormalized: 'framer', category: 'software', extractedItems: [], subject: 'Your Framer receipt', fromEmail: 'billing@framer.com' });
    }

    console.log('Inserting receipts...');
    await db.insert(schema.receipts).values(receiptsToInsert);

    console.log('Triggering analysis...');
    await analyzeSubscriptions(user.id);

    console.log('Done!');
  }
  pool.end();
}
run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
