import { PrismaClient, UserRole, PlanTier, ProjectStatus, CommunicationDirection, CommunicationStatus, ReminderType, AssetType, QuoteStatus, SampleStatus, TeamRole, ManufacturerSource } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

// ---------------------------------------------------------------------------
// Seed Data Definitions
// ---------------------------------------------------------------------------
const COUNTRIES = ['China', 'India', 'Vietnam', 'Turkey', 'Portugal', 'Italy', 'Bangladesh', 'Mexico', 'Thailand', 'Indonesia'];

const MANUFACTURER_NAMES: Record<string, string[]> = {
  China: ['Shenzhen Goldstar Electronics', 'Guangzhou Textile Alliance', 'Dongguan ProPack Materials', 'Shanghai Sunrise Metals', 'Ningbo YuanFeng Plastics'],
  India: ['Mumbai Precision Fabrics', 'Tirupur Knit Works', 'Rajkot Brass Industries', 'Ludhiana Woolen Mills', 'Moradabad Artisan Ceramics'],
  Vietnam: ['Hanoi Modern Textiles', 'Ho Chi Minh Garment Co.', 'Da Nang Footwear Ltd.', 'Saigon Leather Goods', 'Binh Duong Packaging'],
  Turkey: ['Istanbul Grand Bazaar Textiles', 'Denizli Cotton Masters', 'Gaziantep Rug Artisans', 'Bursa Silk House', 'Izmir Marble Works'],
  Portugal: ['Porto Ceramica Fina', 'Lisbon Leather Atelier', 'Braga Premium Textiles', 'Guimaraes Cork Design', 'Aveiro Porcelain Studio'],
  Italy: ['Milano Pelletteria', 'Prato Fine Fabrics', 'Murano Glass Artistry', 'Firenze Leather Craft', 'Sassuolo Tile Masters'],
  Bangladesh: ['Dhaka Garments International', 'Chittagong Knitwear Export', 'Narayanganj Textile Hub', 'Gazipur Apparel Solutions', 'Comilla Jute Works'],
  Mexico: ['Monterrey Metal Fabrication', 'Guadalajara Artisan Pottery', 'Leon Leather Co.', 'Puebla Talavera Workshop', 'Oaxaca Woodcraft Studio'],
  Thailand: ['Bangkok Jewelry Craft', 'Chiang Mai Woodworks', 'Lampang Ceramics Ltd.', 'Samut Prakan Plastics', 'Nakhon Ratchasima Silk'],
  Indonesia: ['Jakarta Rattan Furniture', 'Bali Woodcarving Export', 'Bandung Textile Mills', 'Surabaya Metalwork Co.', 'Yogyakarta Batik House'],
};

const SPECIALTIES = ['textiles', 'electronics', 'packaging', 'metals', 'plastics', 'leather', 'ceramics', 'woodwork'];
const CERTIFICATIONS = ['ISO 9001', 'GOTS', 'OEKO-TEX', 'BSCI', 'SA8000', 'ISO 14001'];

const PROJECT_TITLES = [
  'Eco-Friendly Tote Bag Line',
  'Wireless Earbuds V2',
  'Artisan Coffee Mug Collection',
  'Recycled Denim Jacket',
  'Smart Home Sensor Hub',
  'Premium Leather Wallet',
  'Bamboo Kitchenware Set',
  'Organic Cotton T-Shirt Line',
  'Ceramic Planter Collection',
  'Custom Packaging Redesign',
];

const COMMUNICATION_SUBJECTS = [
  'Initial inquiry about production capabilities',
  'Request for quotation – Spring 2026 collection',
  'MOQ and lead time clarification',
  'Sample request for evaluation',
  'Quality certification documents needed',
  'Pricing negotiation for bulk order',
  'Shipping timeline confirmation',
  'Production progress update',
  'Material specification review',
  'Payment terms discussion',
  'Color swatch and fabric samples',
  'Prototype feedback and revisions',
  'Compliance documentation request',
  'Seasonal capacity planning',
  'Sustainability certification inquiry',
];

const COMMUNICATION_BODIES_SENT = [
  'Dear team,\n\nWe are a growing brand looking for a reliable manufacturing partner for our upcoming product line. Could you share your production capabilities, MOQ requirements, and lead times?\n\nLooking forward to your response.',
  'Hello,\n\nThank you for the initial information. We would like to request a formal quotation for 5,000 units of the product specifications attached. Please include unit pricing at different quantity tiers.\n\nBest regards',
  'Hi there,\n\nFollowing our previous discussion, we wanted to clarify a few points regarding the minimum order quantities and whether there is flexibility for a first trial order. Our target is to start with 1,000 units.\n\nThanks',
  'Good morning,\n\nWe have reviewed your quotation and would like to proceed with sample production. Please send us 3 samples in the colors and materials discussed. We will cover sample and shipping costs.\n\nRegards',
  'Hello,\n\nAs part of our due diligence, we need copies of your ISO 9001 certification and any sustainability-related certifications. Could you send these at your earliest convenience?\n\nThank you',
  'Dear partner,\n\nWe appreciate the competitive pricing. However, for an order of 10,000+ units, we were hoping to discuss a volume discount. Could we schedule a call to discuss pricing tiers?\n\nBest',
  'Hi,\n\nCan you confirm the shipping timeline for our order? We need the goods to arrive at our warehouse by March 15th. Please advise on the fastest shipping options available.\n\nThanks',
  'Hello,\n\nJust checking in on the production progress for order #2024-0892. Could you share photos from the production line and an updated timeline?\n\nBest regards',
];

const COMMUNICATION_BODIES_RECEIVED = [
  'Dear valued customer,\n\nThank you for your interest in our products. We specialize in high-quality manufacturing with MOQ starting from 500 units. Lead time is typically 30-45 days after sample approval. Please find our catalog attached.\n\nBest regards',
  'Hello,\n\nPlease find the quotation as requested. For 5,000 units: $3.50/unit. For 10,000 units: $2.80/unit. These prices include standard packaging. Shipping costs are separate.\n\nRegards',
  'Hi,\n\nYes, we can accommodate a trial order of 1,000 units at a slightly higher per-unit cost of $4.20. This allows you to evaluate our quality before committing to larger volumes.\n\nBest',
  'Dear customer,\n\nSamples are ready and will be shipped via DHL Express. Tracking number will be shared shortly. Expected delivery is within 5-7 business days.\n\nThank you for your patience',
  'Hello,\n\nAttached you will find our ISO 9001:2015 certificate and OEKO-TEX Standard 100 certification. We are also in the process of obtaining GOTS certification, expected Q2 2026.\n\nBest regards',
];

const REMINDER_TITLES = [
  'Follow up with manufacturer on sample status',
  'Review quote expiry from Shenzhen Goldstar',
  'Check production milestone progress',
  'Shipping window closing – confirm order',
  'Sample review deadline',
  'Weekly supplier check-in',
  'Quarterly supplier performance review',
  'Material testing results due',
  'Payment milestone reminder',
  'Certification renewal check',
];

const ASSET_FILENAMES = [
  'spring-2026-moodboard.png',
  'product-sketch-v3.jpg',
  'tech-pack-earbuds.pdf',
  'color-palette-reference.png',
  'material-spec-sheet.pdf',
  'packaging-concept-v2.ai',
  'logo-placement-guide.svg',
  'size-chart-reference.xlsx',
  'cad-model-wallet.step',
  'fabric-swatch-scan.tiff',
  'prototype-photo-front.jpg',
  'prototype-photo-back.jpg',
  'label-design-final.pdf',
  'hang-tag-artwork.ai',
  'lookbook-draft-p1.png',
  'lookbook-draft-p2.png',
  'sustainability-badge.svg',
  'qr-code-template.png',
  'box-dieline-v4.pdf',
  'embroidery-pattern.dst',
];

// ---------------------------------------------------------------------------
// Main Seed
// ---------------------------------------------------------------------------
async function main() {
  console.log('Seeding database…\n');

  // -------------------------------------------------------------------------
  // 1. Users (3)
  // -------------------------------------------------------------------------
  const usersData = [
    { clerkId: 'clerk_admin_001', name: 'Alejandra Reyes', email: 'alejandra@manufacturehub.io', role: 'admin' as UserRole, planTier: 'enterprise' as PlanTier, emailDigest: 'daily' },
    { clerkId: 'clerk_designer_001', name: 'Marcus Chen', email: 'marcus@manufacturehub.io', role: 'designer' as UserRole, planTier: 'pro' as PlanTier, emailDigest: 'weekly' },
    { clerkId: 'clerk_sourcing_001', name: 'Fatima Al-Rashid', email: 'fatima@manufacturehub.io', role: 'sourcing' as UserRole, planTier: 'pro' as PlanTier, emailDigest: 'daily' },
  ];

  const users = await Promise.all(
    usersData.map((u, i) => prisma.user.create({
      data: {
        ...u,
        // First user gets a fixed ID so the dev auth bypass works
        ...(i === 0 ? { id: 'dev-user-1' } : {}),
      },
    })),
  );
  console.log(`  Created ${users.length} users`);

  // -------------------------------------------------------------------------
  // 2. Projects (10)
  // -------------------------------------------------------------------------
  const statuses: ProjectStatus[] = ['ideation', 'sourcing', 'sampling', 'production', 'shipped'];
  const projects = await Promise.all(
    PROJECT_TITLES.map((title, i) =>
      prisma.project.create({
        data: {
          userId: users[i % users.length]!.id,
          title,
          description: `Project for ${title.toLowerCase()}. Targeting Q${randomInt(1, 4)} 2026 launch.`,
          status: statuses[i % statuses.length]!,
          targetLaunchDate: daysFromNow(randomInt(30, 365)),
        },
      }),
    ),
  );
  console.log(`  Created ${projects.length} projects`);

  // -------------------------------------------------------------------------
  // 3. Manufacturers (50)
  // -------------------------------------------------------------------------
  const manufacturers = [];
  for (const country of COUNTRIES) {
    const names = MANUFACTURER_NAMES[country]!;
    for (const name of names) {
      const mfr = await prisma.manufacturer.create({
        data: {
          name,
          country,
          city: name.split(' ')[0], // use first word as city approximation
          specialties: pickN(SPECIALTIES, randomInt(1, 3)),
          certifications: pickN(CERTIFICATIONS, randomInt(1, 4)),
          moq: pick([100, 200, 300, 500, 1000, 2000, 5000]),
          verified: Math.random() > 0.3,
          responseRate: randomFloat(0.4, 1.0),
          rating: randomFloat(3.0, 5.0, 1),
          source: pick(['manual', 'alibaba']) as ManufacturerSource,
          sustainabilityScore: Math.random() > 0.4 ? randomFloat(40, 100) : null,
        },
      });
      manufacturers.push(mfr);
    }
  }
  console.log(`  Created ${manufacturers.length} manufacturers`);

  // -------------------------------------------------------------------------
  // 4. Contacts (100)
  // -------------------------------------------------------------------------
  const firstNames = ['Wei', 'Priya', 'Linh', 'Mehmet', 'Sofia', 'Giovanni', 'Rahim', 'Carlos', 'Suporn', 'Dewi', 'Yuki', 'Sanjay', 'Thi', 'Ayse', 'Joao', 'Marco', 'Nusrat', 'Jorge', 'Anong', 'Wayan'];
  const lastNames = ['Zhang', 'Sharma', 'Nguyen', 'Yilmaz', 'Santos', 'Rossi', 'Hassan', 'Garcia', 'Suwan', 'Putra', 'Li', 'Patel', 'Tran', 'Demir', 'Silva', 'Bianchi', 'Ahmed', 'Lopez', 'Chai', 'Sari'];
  const contactRoles = ['Sales Manager', 'Account Executive', 'Production Manager', 'Quality Control Lead', 'Export Coordinator', 'General Manager', 'Technical Director', 'Logistics Coordinator'];

  const contacts = [];
  for (let i = 0; i < 100; i++) {
    const firstName = pick(firstNames);
    const lastName = pick(lastNames);
    const manufacturer = manufacturers[i % manufacturers.length]!;
    const contact = await prisma.contact.create({
      data: {
        manufacturerId: manufacturer.id,
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${manufacturer.name.toLowerCase().replace(/[^a-z]/g, '').substring(0, 12)}.com`,
        phone: `+${randomInt(1, 99)}-${randomInt(100, 999)}-${randomInt(1000, 9999)}`,
        role: pick(contactRoles),
        lastContactedAt: Math.random() > 0.3 ? daysAgo(randomInt(1, 90)) : null,
        preferredLanguage: pick(['en', 'zh', 'hi', 'vi', 'tr', 'pt', 'it', 'bn', 'es', 'th', 'id']),
      },
    });
    contacts.push(contact);
  }
  console.log(`  Created ${contacts.length} contacts`);

  // -------------------------------------------------------------------------
  // 5. Communications (200)
  // -------------------------------------------------------------------------
  const commStatuses: CommunicationStatus[] = ['draft', 'sent', 'delivered', 'failed', 'archived'];
  const communications = [];
  for (let i = 0; i < 200; i++) {
    const project = pick(projects);
    const manufacturer = pick(manufacturers);
    const mfrContacts = contacts.filter((c) => c.manufacturerId === manufacturer.id);
    const contact = mfrContacts.length > 0 ? pick(mfrContacts) : null;
    const direction: CommunicationDirection = Math.random() > 0.4 ? 'sent' : 'received';
    const body = direction === 'sent' ? pick(COMMUNICATION_BODIES_SENT) : pick(COMMUNICATION_BODIES_RECEIVED);
    const status = direction === 'received' ? 'delivered' as CommunicationStatus : pick(commStatuses);
    const sentAt = status !== 'draft' ? daysAgo(randomInt(1, 120)) : null;

    const comm = await prisma.communication.create({
      data: {
        projectId: project.id,
        manufacturerId: manufacturer.id,
        contactId: contact?.id ?? null,
        subject: pick(COMMUNICATION_SUBJECTS),
        body,
        direction,
        status,
        sentAt,
        followUpDueAt: direction === 'sent' && status === 'delivered' && Math.random() > 0.6
          ? daysFromNow(randomInt(-5, 14))
          : null,
      },
    });
    communications.push(comm);
  }
  console.log(`  Created ${communications.length} communications`);

  // -------------------------------------------------------------------------
  // 6. Reminders (30)
  // -------------------------------------------------------------------------
  const reminderTypes: ReminderType[] = ['follow_up', 'milestone', 'sample_review', 'shipping', 'quote_expiring'];
  const rrules = [null, null, null, 'FREQ=WEEKLY;INTERVAL=1', 'FREQ=DAILY;INTERVAL=3;COUNT=5', 'FREQ=MONTHLY;INTERVAL=1'];

  const reminders = [];
  for (let i = 0; i < 30; i++) {
    const project = pick(projects);
    const user = pick(users);
    const isPast = Math.random() > 0.5;
    const reminder = await prisma.reminder.create({
      data: {
        projectId: project.id,
        userId: user.id,
        type: pick(reminderTypes),
        title: pick(REMINDER_TITLES),
        dueAt: isPast ? daysAgo(randomInt(1, 30)) : daysFromNow(randomInt(1, 60)),
        completed: isPast && Math.random() > 0.3,
        recurrenceRule: pick(rrules),
        snoozeUntil: Math.random() > 0.85 ? daysFromNow(randomInt(1, 7)) : null,
      },
    });
    reminders.push(reminder);
  }
  console.log(`  Created ${reminders.length} reminders`);

  // -------------------------------------------------------------------------
  // 7. Design Assets (20)
  // -------------------------------------------------------------------------
  const assetTypes: AssetType[] = ['sketch', 'moodboard', 'reference', 'spec_sheet', 'cad'];
  const tagOptions = ['spring-2026', 'sustainable', 'premium', 'v2', 'final', 'draft', 'client-approved', 'print-ready', 'sample', 'tech-pack'];

  const designAssets = [];
  for (let i = 0; i < 20; i++) {
    const project = pick(projects);
    const user = pick(users);
    const fileName = ASSET_FILENAMES[i % ASSET_FILENAMES.length]!;
    const asset = await prisma.designAsset.create({
      data: {
        projectId: project.id,
        userId: user.id,
        type: pick(assetTypes),
        fileName,
        fileUrl: `https://cdn.manufacturehub.io/assets/${project.id}/${fileName}`,
        thumbnailUrl: Math.random() > 0.3 ? `https://cdn.manufacturehub.io/thumbs/${project.id}/${fileName}.webp` : null,
        tags: pickN(tagOptions, randomInt(1, 4)),
        version: randomInt(1, 5),
      },
    });
    designAssets.push(asset);
  }
  console.log(`  Created ${designAssets.length} design assets`);

  // -------------------------------------------------------------------------
  // 8. Quotes (15)
  // -------------------------------------------------------------------------
  const currencies = ['USD', 'EUR', 'GBP', 'CNY'];
  const quoteStatuses: QuoteStatus[] = ['pending', 'accepted', 'rejected'];

  const quotes = [];
  for (let i = 0; i < 15; i++) {
    const project = pick(projects);
    const manufacturer = pick(manufacturers);
    const quote = await prisma.quote.create({
      data: {
        projectId: project.id,
        manufacturerId: manufacturer.id,
        unitPrice: randomFloat(0.50, 85.00),
        currency: pick(currencies),
        moq: pick([100, 250, 500, 1000, 2000, 5000]),
        leadTimeDays: randomInt(14, 90),
        validityDate: daysFromNow(randomInt(7, 60)),
        status: pick(quoteStatuses),
        notes: pick([
          'Price includes standard packaging. Tooling fee of $500 applies for first order.',
          'Bulk discount available for orders above 10,000 units. FOB Shenzhen.',
          'Price valid for 30 days. Sample cost deducted from first production order.',
          'Includes OEKO-TEX certified materials. MOQ negotiable for first order.',
          'CIF pricing. Includes quality inspection before shipment.',
          null,
        ]),
      },
    });
    quotes.push(quote);
  }
  console.log(`  Created ${quotes.length} quotes`);

  // -------------------------------------------------------------------------
  // 9. Samples (10)
  // -------------------------------------------------------------------------
  const sampleStatuses: SampleStatus[] = ['requested', 'in_transit', 'received', 'approved', 'rejected'];

  const samples = [];
  for (let i = 0; i < 10; i++) {
    const project = pick(projects);
    const manufacturer = pick(manufacturers);
    const status = sampleStatuses[i % sampleStatuses.length]!;
    const sample = await prisma.sample.create({
      data: {
        projectId: project.id,
        manufacturerId: manufacturer.id,
        requestedAt: daysAgo(randomInt(10, 60)),
        receivedAt: ['received', 'approved', 'rejected'].includes(status) ? daysAgo(randomInt(1, 10)) : null,
        status,
        trackingNumber: ['in_transit', 'received', 'approved', 'rejected'].includes(status)
          ? `${pick(['DHL', 'FEDEX', 'UPS', 'SF'])}${randomInt(100000000, 999999999)}`
          : null,
        notes: pick([
          'Color matches Pantone 2025 C. Stitching quality is excellent.',
          'Slight variation in fabric weight – within acceptable tolerance.',
          'Material feels premium. Logo embossing is crisp.',
          'Sample rejected – wrong thread color used. Requesting revision.',
          'Packaging sample looks great. Minor adjustment needed on fold line.',
          null,
        ]),
        photos: Math.random() > 0.4
          ? Array.from({ length: randomInt(1, 4) }, (_, j) =>
              `https://cdn.manufacturehub.io/samples/${project.id}/sample-${i}-photo-${j + 1}.jpg`,
            )
          : [],
      },
    });
    samples.push(sample);
  }
  console.log(`  Created ${samples.length} samples`);

  // -------------------------------------------------------------------------
  // 10. Team Members
  // -------------------------------------------------------------------------
  const teamRoles: TeamRole[] = ['owner', 'editor', 'viewer'];
  const teamMembers = [];

  for (const project of projects) {
    // Owner is already the project creator – add other users as team members
    const otherUsers = users.filter((u) => u.id !== project.userId);
    for (const user of otherUsers) {
      if (Math.random() > 0.4) {
        const tm = await prisma.teamMember.create({
          data: {
            projectId: project.id,
            userId: user.id,
            role: pick(teamRoles),
            invitedAt: daysAgo(randomInt(1, 90)),
            acceptedAt: Math.random() > 0.2 ? daysAgo(randomInt(0, 30)) : null,
          },
        });
        teamMembers.push(tm);
      }
    }
  }
  console.log(`  Created ${teamMembers.length} team member assignments`);

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('\nSeed complete!');
  console.log('  Users:          ', users.length);
  console.log('  Projects:       ', projects.length);
  console.log('  Manufacturers:  ', manufacturers.length);
  console.log('  Contacts:       ', contacts.length);
  console.log('  Communications: ', communications.length);
  console.log('  Reminders:      ', reminders.length);
  console.log('  Design Assets:  ', designAssets.length);
  console.log('  Quotes:         ', quotes.length);
  console.log('  Samples:        ', samples.length);
  console.log('  Team Members:   ', teamMembers.length);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
