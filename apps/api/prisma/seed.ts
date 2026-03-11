import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...\n");

  // ---------------------------------------------------------------------------
  // Clean existing data (in correct FK order)
  // ---------------------------------------------------------------------------
  await prisma.auditLog.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.moodboardItem.deleteMany();
  await prisma.designAsset.deleteMany();
  await prisma.aiInsight.deleteMany();
  await prisma.communication.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.sample.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.project.deleteMany();
  await prisma.manufacturer.deleteMany();
  await prisma.user.deleteMany();
  console.log("  Cleared existing data");

  // ---------------------------------------------------------------------------
  // 1. Dev user
  // ---------------------------------------------------------------------------
  const user = await prisma.user.create({
    data: {
      id: "dev-user-1",
      clerkId: "user_dev_local_00001",
      name: "Dev User",
      email: "dev@manufacturehub.com",
      role: "designer",
      planTier: "pro",
      emailDigest: "daily",
    },
  });
  console.log(`  User: ${user.name} (${user.id})`);

  // ---------------------------------------------------------------------------
  // 2. Manufacturers (matching mock-data.ts)
  // ---------------------------------------------------------------------------
  const mfgData = [
    {
      name: "Shanghai Textile Co.",
      country: "China",
      city: "Shanghai",
      specialties: ["Cotton", "Polyester", "Silk"],
      certifications: ["ISO 9001", "OEKO-TEX"],
      moq: 500,
      verified: true,
      responseRate: 0.92,
      rating: 4.5,
      sustainabilityScore: 72,
      source: "manual" as const,
      contactName: "Li Wei",
      contactEmail: "info@shanghaitextile.cn",
      contactPhone: "+86 21 5555 0100",
    },
    {
      name: "Mumbai Garments Ltd.",
      country: "India",
      city: "Mumbai",
      specialties: ["Knitwear", "Denim", "Embroidery"],
      certifications: ["ISO 14001", "GOTS", "Fair Trade"],
      moq: 200,
      verified: true,
      responseRate: 0.88,
      rating: 4.2,
      sustainabilityScore: 85,
      source: "manual" as const,
      contactName: "Priya Sharma",
      contactEmail: "sales@mumbaigarments.in",
      contactPhone: "+91 22 4444 0200",
    },
    {
      name: "Hanoi Fashion Factory",
      country: "Vietnam",
      city: "Hanoi",
      specialties: ["Sportswear", "Activewear", "Outerwear"],
      certifications: ["WRAP", "BSCI"],
      moq: 1000,
      verified: false,
      responseRate: 0.78,
      rating: 4.0,
      sustainabilityScore: 58,
      source: "manual" as const,
      contactName: "Nguyen Tran",
      contactEmail: "export@hanoiff.vn",
      contactPhone: "+84 24 3333 0300",
    },
    {
      name: "Istanbul Leather Works",
      country: "Turkey",
      city: "Istanbul",
      specialties: ["Leather Goods", "Bags", "Accessories"],
      certifications: ["ISO 9001"],
      moq: 100,
      verified: true,
      responseRate: 0.95,
      rating: 4.7,
      sustainabilityScore: 65,
      source: "manual" as const,
      contactName: "Mehmet Yilmaz",
      contactEmail: "contact@istanbulleather.tr",
      contactPhone: "+90 212 555 0400",
    },
    {
      name: "Dhaka Denim Corp.",
      country: "Bangladesh",
      city: "Dhaka",
      specialties: ["Denim", "Woven Shirts", "Trousers"],
      certifications: ["BSCI", "OEKO-TEX", "ISO 14001"],
      moq: 2000,
      verified: true,
      responseRate: 0.82,
      rating: 3.8,
      sustainabilityScore: 70,
      source: "manual" as const,
      contactName: "Rahman Ali",
      contactEmail: "orders@dhakadenim.bd",
      contactPhone: "+880 2 7777 0500",
    },
    {
      name: "Milano Atelier SRL",
      country: "Italy",
      city: "Milano",
      specialties: ["Luxury Fabrics", "Tailoring", "Cashmere"],
      certifications: ["ISO 9001", "GOTS"],
      moq: 50,
      verified: true,
      responseRate: 0.97,
      rating: 4.9,
      sustainabilityScore: 90,
      source: "manual" as const,
      contactName: "Marco Rossi",
      contactEmail: "atelier@milanoatelier.it",
      contactPhone: "+39 02 8888 0600",
    },
    {
      name: "Portland Apparel Co.",
      country: "USA",
      city: "Portland",
      specialties: ["Streetwear", "Screen Printing", "Cut & Sew"],
      certifications: ["Fair Trade"],
      moq: 50,
      verified: false,
      responseRate: 0.9,
      rating: 4.3,
      sustainabilityScore: 80,
      source: "manual" as const,
      contactName: "Jake Thompson",
      contactEmail: "hello@portlandapparel.com",
      contactPhone: "+1 503 555 0700",
    },
    {
      name: "Guadalajara Textiles SA",
      country: "Mexico",
      city: "Guadalajara",
      specialties: ["Organic Cotton", "Blankets", "Home Textiles"],
      certifications: ["GOTS", "Fair Trade"],
      moq: 300,
      verified: true,
      responseRate: 0.85,
      rating: 4.1,
      sustainabilityScore: 88,
      source: "manual" as const,
      contactName: "Carlos Hernandez",
      contactEmail: "ventas@gdltextiles.mx",
      contactPhone: "+52 33 9999 0800",
    },
    {
      name: "Porto Footwear Lda.",
      country: "Portugal",
      city: "Porto",
      specialties: ["Footwear", "Leather Shoes", "Sneakers"],
      certifications: ["ISO 9001", "ISO 14001"],
      moq: 200,
      verified: true,
      responseRate: 0.91,
      rating: 4.6,
      sustainabilityScore: 75,
      source: "manual" as const,
      contactName: "Ana Silva",
      contactEmail: "info@portofootwear.pt",
      contactPhone: "+351 22 1111 0900",
    },
    {
      name: "Bangkok Silk House",
      country: "Thailand",
      city: "Bangkok",
      specialties: ["Silk", "Resort Wear", "Swimwear"],
      certifications: ["OEKO-TEX"],
      moq: 100,
      verified: false,
      responseRate: 0.8,
      rating: 4.4,
      sustainabilityScore: 62,
      source: "manual" as const,
      contactName: "Somchai Prasert",
      contactEmail: "trade@bangkoksilk.th",
      contactPhone: "+66 2 2222 1000",
    },
    {
      name: "Shenzhen Tech Wear",
      country: "China",
      city: "Shenzhen",
      specialties: ["Technical Fabrics", "Waterproof Gear", "Uniforms"],
      certifications: ["ISO 9001", "ISO 14001", "OEKO-TEX"],
      moq: 1000,
      verified: true,
      responseRate: 0.87,
      rating: 4.3,
      sustainabilityScore: 68,
      source: "manual" as const,
      contactName: "Chen Xiaoming",
      contactEmail: "tech@sztechwear.cn",
      contactPhone: "+86 755 3333 1100",
    },
    {
      name: "Jaipur Handicrafts",
      country: "India",
      city: "Jaipur",
      specialties: ["Block Print", "Hand Weaving", "Natural Dyes"],
      certifications: ["GOTS", "Fair Trade"],
      moq: 50,
      verified: true,
      responseRate: 0.93,
      rating: 4.8,
      sustainabilityScore: 95,
      source: "manual" as const,
      contactName: "Ananya Gupta",
      contactEmail: "artisan@jaipurcraft.in",
      contactPhone: "+91 141 5555 1200",
    },
  ];

  const manufacturers: Record<string, string> = {}; // name -> id

  for (const m of mfgData) {
    const { contactName, contactEmail, contactPhone, ...mfgFields } = m;
    const mfg = await prisma.manufacturer.create({ data: mfgFields });
    manufacturers[mfg.name] = mfg.id;

    await prisma.contact.create({
      data: {
        manufacturerId: mfg.id,
        name: contactName,
        email: contactEmail,
        phone: contactPhone,
        role: "Sales Manager",
      },
    });
  }
  console.log(`  Manufacturers: ${Object.keys(manufacturers).length} (with contacts)`);

  // ---------------------------------------------------------------------------
  // 3. Projects (matching mock-data.ts)
  // ---------------------------------------------------------------------------
  const projectsData = [
    {
      title: "Spring Collection 2026",
      description:
        "Lightweight cotton and linen pieces for the upcoming spring season. Focus on sustainable materials and pastel colorways.",
      status: "production" as const,
      targetLaunchDate: new Date("2026-05-01"),
      createdAt: new Date("2025-09-15"),
    },
    {
      title: "Denim Capsule Line",
      description:
        "Premium selvedge denim jeans and jackets. Partnering with Japanese denim mills for raw materials.",
      status: "sampling" as const,
      targetLaunchDate: new Date("2026-08-01"),
      createdAt: new Date("2025-11-01"),
    },
    {
      title: "Athleisure Basics",
      description:
        "Core basics range: joggers, hoodies, and t-shirts in performance cotton blends.",
      status: "sourcing" as const,
      targetLaunchDate: new Date("2026-09-01"),
      createdAt: new Date("2026-01-10"),
    },
    {
      title: "Resort Swim 2027",
      description:
        "Early development of resort swimwear collection with recycled nylon fabrics.",
      status: "ideation" as const,
      targetLaunchDate: new Date("2027-01-15"),
      createdAt: new Date("2026-02-20"),
    },
    {
      title: "Winter Outerwear",
      description:
        "Heavy-duty parkas, puffer jackets, and insulated vests for fall/winter.",
      status: "shipped" as const,
      targetLaunchDate: new Date("2025-11-01"),
      createdAt: new Date("2025-06-01"),
    },
    {
      title: "Leather Accessories",
      description:
        "Small leather goods: wallets, cardholders, belts, and key fobs in full-grain Italian leather.",
      status: "production" as const,
      targetLaunchDate: new Date("2026-06-01"),
      createdAt: new Date("2025-10-20"),
    },
    {
      title: "Organic Kids Line",
      description:
        "GOTS-certified organic cotton childrens clothing. Ages 2-10.",
      status: "sourcing" as const,
      targetLaunchDate: new Date("2026-10-01"),
      createdAt: new Date("2026-01-25"),
    },
  ];

  const projects: Record<string, string> = {}; // title -> id
  for (const p of projectsData) {
    const project = await prisma.project.create({
      data: { userId: user.id, ...p },
    });
    projects[project.title] = project.id;
  }
  console.log(`  Projects: ${Object.keys(projects).length}`);

  // ---------------------------------------------------------------------------
  // 4. Quotes (matching mock-data.ts)
  // ---------------------------------------------------------------------------
  const quotesData = [
    {
      projectTitle: "Spring Collection 2026",
      mfgName: "Shanghai Textile Co.",
      unitPrice: 12.5,
      moq: 500,
      leadTimeDays: 35,
      currency: "USD",
      status: "accepted" as const,
      validityDate: new Date("2026-04-15"),
      notes: "Includes custom dye matching and eco-friendly packaging.",
    },
    {
      projectTitle: "Denim Capsule Line",
      mfgName: "Dhaka Denim Corp.",
      unitPrice: 18.75,
      moq: 2000,
      leadTimeDays: 60,
      currency: "USD",
      status: "pending" as const,
      validityDate: new Date("2026-04-01"),
      notes: "14oz selvedge denim. Price includes washing and finishing.",
    },
    {
      projectTitle: "Athleisure Basics",
      mfgName: "Hanoi Fashion Factory",
      unitPrice: 8.2,
      moq: 1000,
      leadTimeDays: 45,
      currency: "USD",
      status: "pending" as const,
      validityDate: new Date("2026-04-10"),
      notes: "Performance cotton blend joggers. Bulk discount at 5,000+ units.",
    },
    {
      projectTitle: "Leather Accessories",
      mfgName: "Istanbul Leather Works",
      unitPrice: 35.0,
      moq: 100,
      leadTimeDays: 30,
      currency: "USD",
      status: "accepted" as const,
      validityDate: new Date("2026-05-01"),
      notes: "Full-grain Italian leather wallets and cardholders.",
    },
    {
      projectTitle: "Spring Collection 2026",
      mfgName: "Milano Atelier SRL",
      unitPrice: 45.0,
      moq: 200,
      leadTimeDays: 40,
      currency: "EUR",
      status: "pending" as const,
      validityDate: new Date("2026-04-20"),
      notes: "Cashmere-cotton blend lightweight knits.",
    },
    {
      projectTitle: "Winter Outerwear",
      mfgName: "Shenzhen Tech Wear",
      unitPrice: 55.0,
      moq: 500,
      leadTimeDays: 50,
      currency: "USD",
      status: "rejected" as const,
      validityDate: new Date("2025-12-01"),
      notes: "Insulated puffer jackets with recycled fill. Price too high.",
    },
  ];

  let quoteCount = 0;
  for (const q of quotesData) {
    const { projectTitle, mfgName, ...fields } = q;
    await prisma.quote.create({
      data: {
        projectId: projects[projectTitle],
        manufacturerId: manufacturers[mfgName],
        ...fields,
      },
    });
    quoteCount++;
  }
  console.log(`  Quotes: ${quoteCount}`);

  // ---------------------------------------------------------------------------
  // 5. Samples (matching mock-data.ts)
  // ---------------------------------------------------------------------------
  const samplesData = [
    {
      projectTitle: "Spring Collection 2026",
      mfgName: "Shanghai Textile Co.",
      status: "received" as const,
      trackingNumber: "DHL-8847562910",
      notes:
        "Cotton quality excellent. Color slightly off on pastel rose -- need re-dye.",
      requestedAt: new Date("2026-02-25"),
      receivedAt: new Date("2026-03-08") as Date | null,
    },
    {
      projectTitle: "Denim Capsule Line",
      mfgName: "Dhaka Denim Corp.",
      status: "in_transit" as const,
      trackingNumber: "FEDEX-4423891057",
      notes: "14oz selvedge sample pair in rigid wash.",
      requestedAt: new Date("2026-03-01"),
      receivedAt: null as Date | null,
    },
    {
      projectTitle: "Leather Accessories",
      mfgName: "Istanbul Leather Works",
      status: "approved" as const,
      trackingNumber: "UPS-7756120384",
      notes: "Wallet craftsmanship is superb. Approved for production.",
      requestedAt: new Date("2026-02-10"),
      receivedAt: new Date("2026-02-28") as Date | null,
    },
    {
      projectTitle: "Athleisure Basics",
      mfgName: "Hanoi Fashion Factory",
      status: "requested" as const,
      trackingNumber: null as string | null,
      notes: "Jogger sample in 3 colorways. Expected ship date: March 20.",
      requestedAt: new Date("2026-03-05"),
      receivedAt: null as Date | null,
    },
    {
      projectTitle: "Organic Kids Line",
      mfgName: "Jaipur Handicrafts",
      status: "requested" as const,
      trackingNumber: null as string | null,
      notes: "Block-printed organic cotton onesies, sizes 6M-2T.",
      requestedAt: new Date("2026-03-10"),
      receivedAt: null as Date | null,
    },
  ];

  let sampleCount = 0;
  for (const s of samplesData) {
    const { projectTitle, mfgName, ...fields } = s;
    await prisma.sample.create({
      data: {
        projectId: projects[projectTitle],
        manufacturerId: manufacturers[mfgName],
        ...fields,
      },
    });
    sampleCount++;
  }
  console.log(`  Samples: ${sampleCount}`);

  // ---------------------------------------------------------------------------
  // 6. Communications (matching mock-data.ts)
  // ---------------------------------------------------------------------------
  const commsData = [
    {
      projectTitle: "Spring Collection 2026",
      mfgName: "Shanghai Textile Co.",
      subject: "Spring Collection fabric samples",
      messages: [
        {
          direction: "sent" as const,
          body: "Hi, we would like to request fabric swatches for our Spring 2026 collection. Specifically interested in your organic cotton range in pastel shades.",
          sentAt: new Date("2026-03-01T10:00:00Z"),
        },
        {
          direction: "received" as const,
          body: "Thank you for your interest. We have prepared a swatch book with 24 pastel colorways in our OC-200 organic cotton. Shipping to you today via DHL.",
          sentAt: new Date("2026-03-02T08:30:00Z"),
        },
      ],
    },
    {
      projectTitle: "Denim Capsule Line",
      mfgName: "Dhaka Denim Corp.",
      subject: "Selvedge denim pricing inquiry",
      messages: [
        {
          direction: "sent" as const,
          body: "We are looking for 14oz selvedge denim. Can you provide pricing for 5,000 yards?",
          sentAt: new Date("2026-03-05T14:00:00Z"),
        },
      ],
    },
    {
      projectTitle: "Athleisure Basics",
      mfgName: "Hanoi Fashion Factory",
      subject: "Athleisure MOQ and lead times",
      messages: [
        {
          direction: "sent" as const,
          body: "What are your MOQs and lead times for performance cotton joggers and hoodies?",
          sentAt: new Date("2026-02-28T09:00:00Z"),
        },
        {
          direction: "received" as const,
          body: "For joggers: MOQ 1,000 pcs/color, 45 day lead time. For hoodies: MOQ 800 pcs/color, 50 day lead time. Bulk discounts available for 5,000+ units.",
          sentAt: new Date("2026-03-01T11:00:00Z"),
        },
        {
          direction: "sent" as const,
          body: "Thanks. Can you send a tech pack template so we can provide specifications?",
          sentAt: new Date("2026-03-03T16:00:00Z"),
        },
      ],
    },
    {
      projectTitle: "Spring Collection 2026",
      mfgName: "Milano Atelier SRL",
      subject: "Cashmere blend availability",
      messages: [
        {
          direction: "sent" as const,
          body: "Do you have cashmere-cotton blends available for lightweight spring knits?",
          sentAt: new Date("2026-03-08T10:00:00Z"),
        },
        {
          direction: "received" as const,
          body: "Yes, we offer a 30/70 cashmere-cotton blend at \u20ac28/meter. Minimum 200 meters. Available in 15 colors.",
          sentAt: new Date("2026-03-09T09:15:00Z"),
        },
      ],
    },
  ];

  let commCount = 0;
  for (const c of commsData) {
    const { projectTitle, mfgName, subject, messages } = c;
    for (const msg of messages) {
      await prisma.communication.create({
        data: {
          projectId: projects[projectTitle],
          manufacturerId: manufacturers[mfgName],
          subject,
          body: msg.body,
          direction: msg.direction,
          status: "sent",
          sentAt: msg.sentAt,
        },
      });
      commCount++;
    }
  }
  console.log(`  Communications: ${commCount}`);

  // ---------------------------------------------------------------------------
  // 7. Reminders (matching mock-data.ts)
  // ---------------------------------------------------------------------------
  const remindersData = [
    {
      projectTitle: "Spring Collection 2026",
      type: "follow_up" as const,
      title: "Follow up with Shanghai Textile on samples",
      dueAt: new Date("2026-03-13"),
    },
    {
      projectTitle: "Denim Capsule Line",
      type: "milestone" as const,
      title: "Denim supplier decision deadline",
      dueAt: new Date("2026-03-14"),
    },
    {
      projectTitle: "Athleisure Basics",
      type: "sample_review" as const,
      title: "Review athleisure tech packs",
      dueAt: new Date("2026-03-15"),
    },
    {
      projectTitle: "Organic Kids Line",
      type: "milestone" as const,
      title: "Kids line fabric testing results",
      dueAt: new Date("2026-03-16"),
    },
    {
      projectTitle: "Leather Accessories",
      type: "sample_review" as const,
      title: "Leather sample inspection",
      dueAt: new Date("2026-03-17"),
    },
  ];

  let reminderCount = 0;
  for (const r of remindersData) {
    const { projectTitle, ...fields } = r;
    await prisma.reminder.create({
      data: {
        projectId: projects[projectTitle],
        userId: user.id,
        ...fields,
      },
    });
    reminderCount++;
  }
  console.log(`  Reminders: ${reminderCount}`);

  // ---------------------------------------------------------------------------
  // 8. Team membership (owner on all projects)
  // ---------------------------------------------------------------------------
  for (const projectId of Object.values(projects)) {
    await prisma.teamMember.create({
      data: {
        projectId,
        userId: user.id,
        role: "owner",
        acceptedAt: new Date(),
      },
    });
  }
  console.log(`  Team memberships: ${Object.keys(projects).length}`);

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log("\nSeed complete!");
  console.log("  Users:          1");
  console.log("  Manufacturers: ", Object.keys(manufacturers).length);
  console.log("  Projects:      ", Object.keys(projects).length);
  console.log("  Quotes:        ", quoteCount);
  console.log("  Samples:       ", sampleCount);
  console.log("  Communications:", commCount);
  console.log("  Reminders:     ", reminderCount);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
