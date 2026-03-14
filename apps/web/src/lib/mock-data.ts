// Mock data for demo mode (GitHub Pages / no backend)

// Use real API if VITE_API_URL is set or running on localhost; otherwise demo mode
export const DEMO_MODE = !import.meta.env.VITE_API_URL && !window.location.hostname.includes('localhost');

const manufacturers = [
  { id: 'm1', name: 'Shanghai Textile Co.', country: 'China', specialties: ['Cotton', 'Polyester', 'Silk'], certifications: ['ISO 9001', 'OEKO-TEX'], rating: 4.5, verified: true, sustainabilityScore: 72, moqMin: 500, moqMax: 50000, contactEmail: 'info@shanghaitextile.cn', contactPhone: '+86 21 5555 0100', website: 'shanghaitextile.cn', description: 'Leading textile manufacturer with 20+ years of export experience. Specializing in premium cotton and silk blends for fashion brands worldwide.', createdAt: '2024-01-15' },
  { id: 'm2', name: 'Mumbai Garments Ltd.', country: 'India', specialties: ['Knitwear', 'Denim', 'Embroidery'], certifications: ['ISO 14001', 'GOTS', 'Fair Trade'], rating: 4.2, verified: true, sustainabilityScore: 85, moqMin: 200, moqMax: 20000, contactEmail: 'sales@mumbaigarments.in', contactPhone: '+91 22 4444 0200', website: 'mumbaigarments.in', description: 'Sustainable garment manufacturer specializing in organic cotton knitwear and hand-embroidered pieces.', createdAt: '2024-02-10' },
  { id: 'm3', name: 'Hanoi Fashion Factory', country: 'Vietnam', specialties: ['Sportswear', 'Activewear', 'Outerwear'], certifications: ['WRAP', 'BSCI'], rating: 4.0, verified: false, sustainabilityScore: 58, moqMin: 1000, moqMax: 100000, contactEmail: 'export@hanoiff.vn', contactPhone: '+84 24 3333 0300', website: 'hanoifashionfactory.vn', description: 'High-volume sportswear and activewear production with quick turnaround times.', createdAt: '2024-03-05' },
  { id: 'm4', name: 'Istanbul Leather Works', country: 'Turkey', specialties: ['Leather Goods', 'Bags', 'Accessories'], certifications: ['ISO 9001'], rating: 4.7, verified: true, sustainabilityScore: 65, moqMin: 100, moqMax: 5000, contactEmail: 'contact@istanbulleather.tr', contactPhone: '+90 212 555 0400', website: 'istanbulleatherworks.com', description: 'Premium leather goods manufacturer known for exceptional craftsmanship and Italian-style finishing.', createdAt: '2024-01-20' },
  { id: 'm5', name: 'Dhaka Denim Corp.', country: 'Bangladesh', specialties: ['Denim', 'Woven Shirts', 'Trousers'], certifications: ['BSCI', 'OEKO-TEX', 'ISO 14001'], rating: 3.8, verified: true, sustainabilityScore: 70, moqMin: 2000, moqMax: 200000, contactEmail: 'orders@dhakadenim.bd', contactPhone: '+880 2 7777 0500', website: 'dhakadenim.com', description: 'One of the largest denim producers in South Asia with state-of-the-art washing and finishing facilities.', createdAt: '2024-04-12' },
  { id: 'm6', name: 'Milano Atelier SRL', country: 'Italy', specialties: ['Luxury Fabrics', 'Tailoring', 'Cashmere'], certifications: ['ISO 9001', 'GOTS'], rating: 4.9, verified: true, sustainabilityScore: 90, moqMin: 50, moqMax: 2000, contactEmail: 'atelier@milanoatelier.it', contactPhone: '+39 02 8888 0600', website: 'milanoatelier.it', description: 'Family-owned luxury fabric house producing the finest cashmere and wool blends since 1962.', createdAt: '2023-11-01' },
  { id: 'm7', name: 'Portland Apparel Co.', country: 'USA', specialties: ['Streetwear', 'Screen Printing', 'Cut & Sew'], certifications: ['Fair Trade'], rating: 4.3, verified: false, sustainabilityScore: 80, moqMin: 50, moqMax: 5000, contactEmail: 'hello@portlandapparel.com', contactPhone: '+1 503 555 0700', website: 'portlandapparel.com', description: 'Domestic cut-and-sew manufacturer focused on streetwear and direct-to-consumer brands.', createdAt: '2024-05-20' },
  { id: 'm8', name: 'Guadalajara Textiles SA', country: 'Mexico', specialties: ['Organic Cotton', 'Blankets', 'Home Textiles'], certifications: ['GOTS', 'Fair Trade'], rating: 4.1, verified: true, sustainabilityScore: 88, moqMin: 300, moqMax: 15000, contactEmail: 'ventas@gdltextiles.mx', contactPhone: '+52 33 9999 0800', website: 'guadalajaratextiles.mx', description: 'Organic cotton specialist producing sustainable home textiles and blankets with traditional Mexican artisanal techniques.', createdAt: '2024-06-15' },
  { id: 'm9', name: 'Porto Footwear Lda.', country: 'Portugal', specialties: ['Footwear', 'Leather Shoes', 'Sneakers'], certifications: ['ISO 9001', 'ISO 14001'], rating: 4.6, verified: true, sustainabilityScore: 75, moqMin: 200, moqMax: 10000, contactEmail: 'info@portofootwear.pt', contactPhone: '+351 22 1111 0900', website: 'portofootwear.pt', description: 'European footwear manufacturer with expertise in premium leather shoes and modern sneaker construction.', createdAt: '2024-02-28' },
  { id: 'm10', name: 'Bangkok Silk House', country: 'Thailand', specialties: ['Silk', 'Resort Wear', 'Swimwear'], certifications: ['OEKO-TEX'], rating: 4.4, verified: false, sustainabilityScore: 62, moqMin: 100, moqMax: 8000, contactEmail: 'trade@bangkoksilk.th', contactPhone: '+66 2 2222 1000', website: 'bangkoksilkhouse.com', description: 'Traditional Thai silk weaving combined with modern resort wear production for global fashion brands.', createdAt: '2024-03-18' },
  { id: 'm11', name: 'Shenzhen Tech Wear', country: 'China', specialties: ['Technical Fabrics', 'Waterproof Gear', 'Uniforms'], certifications: ['ISO 9001', 'ISO 14001', 'OEKO-TEX'], rating: 4.3, verified: true, sustainabilityScore: 68, moqMin: 1000, moqMax: 50000, contactEmail: 'tech@sztechwear.cn', contactPhone: '+86 755 3333 1100', website: 'sztechwear.cn', description: 'Technical fabric specialist manufacturing performance outerwear, workwear, and protective clothing.', createdAt: '2024-07-01' },
  { id: 'm12', name: 'Jaipur Handicrafts', country: 'India', specialties: ['Block Print', 'Hand Weaving', 'Natural Dyes'], certifications: ['GOTS', 'Fair Trade'], rating: 4.8, verified: true, sustainabilityScore: 95, moqMin: 50, moqMax: 3000, contactEmail: 'artisan@jaipurcraft.in', contactPhone: '+91 141 5555 1200', website: 'jaipurhandicrafts.in', description: 'Artisanal textile workshop preserving traditional Rajasthani block printing and natural dyeing techniques.', createdAt: '2024-01-08' },
];

const projects = [
  { id: 'p1', name: 'Spring Collection 2026', description: 'Lightweight cotton and linen pieces for the upcoming spring season. Focus on sustainable materials and pastel colorways.', status: 'production', manufacturerCount: 3, createdAt: '2025-09-15', updatedAt: '2026-03-08', teamMembers: [] },
  { id: 'p2', name: 'Denim Capsule Line', description: 'Premium selvedge denim jeans and jackets. Partnering with Japanese denim mills for raw materials.', status: 'sampling', manufacturerCount: 2, createdAt: '2025-11-01', updatedAt: '2026-03-10', teamMembers: [] },
  { id: 'p3', name: 'Athleisure Basics', description: 'Core basics range: joggers, hoodies, and t-shirts in performance cotton blends.', status: 'sourcing', manufacturerCount: 5, createdAt: '2026-01-10', updatedAt: '2026-03-09', teamMembers: [] },
  { id: 'p4', name: 'Resort Swim 2027', description: 'Early development of resort swimwear collection with recycled nylon fabrics.', status: 'ideation', manufacturerCount: 0, createdAt: '2026-02-20', updatedAt: '2026-03-05', teamMembers: [] },
  { id: 'p5', name: 'Winter Outerwear', description: 'Heavy-duty parkas, puffer jackets, and insulated vests for fall/winter.', status: 'shipped', manufacturerCount: 2, createdAt: '2025-06-01', updatedAt: '2026-02-15', teamMembers: [] },
  { id: 'p6', name: 'Leather Accessories', description: 'Small leather goods: wallets, cardholders, belts, and key fobs in full-grain Italian leather.', status: 'production', manufacturerCount: 1, createdAt: '2025-10-20', updatedAt: '2026-03-07', teamMembers: [] },
  { id: 'p7', name: 'Organic Kids Line', description: 'GOTS-certified organic cotton childrens clothing. Ages 2-10.', status: 'sourcing', manufacturerCount: 4, createdAt: '2026-01-25', updatedAt: '2026-03-11', teamMembers: [] },
];

const communications = [
  { id: 'c1', projectId: 'p1', manufacturerId: 'm1', manufacturerName: 'Shanghai Textile Co.', subject: 'Spring Collection fabric samples', messages: [{ id: 'msg1', sender: 'user' as const, content: 'Hi, we would like to request fabric swatches for our Spring 2026 collection. Specifically interested in your organic cotton range in pastel shades.', createdAt: '2026-03-01T10:00:00Z' }, { id: 'msg2', sender: 'manufacturer' as const, content: 'Thank you for your interest. We have prepared a swatch book with 24 pastel colorways in our OC-200 organic cotton. Shipping to you today via DHL.', createdAt: '2026-03-02T08:30:00Z' }], status: 'reply_received' as const, lastMessageAt: '2026-03-02T08:30:00Z', createdAt: '2026-03-01T10:00:00Z' },
  { id: 'c2', projectId: 'p2', manufacturerId: 'm5', manufacturerName: 'Dhaka Denim Corp.', subject: 'Selvedge denim pricing inquiry', messages: [{ id: 'msg3', sender: 'user' as const, content: 'We are looking for 14oz selvedge denim. Can you provide pricing for 5,000 yards?', createdAt: '2026-03-05T14:00:00Z' }], status: 'awaiting_reply' as const, lastMessageAt: '2026-03-05T14:00:00Z', createdAt: '2026-03-05T14:00:00Z' },
  { id: 'c3', projectId: 'p3', manufacturerId: 'm3', manufacturerName: 'Hanoi Fashion Factory', subject: 'Athleisure MOQ and lead times', messages: [{ id: 'msg4', sender: 'user' as const, content: 'What are your MOQs and lead times for performance cotton joggers and hoodies?', createdAt: '2026-02-28T09:00:00Z' }, { id: 'msg5', sender: 'manufacturer' as const, content: 'For joggers: MOQ 1,000 pcs/color, 45 day lead time. For hoodies: MOQ 800 pcs/color, 50 day lead time. Bulk discounts available for 5,000+ units.', createdAt: '2026-03-01T11:00:00Z' }, { id: 'msg6', sender: 'user' as const, content: 'Thanks. Can you send a tech pack template so we can provide specifications?', createdAt: '2026-03-03T16:00:00Z' }], status: 'follow_up_due' as const, lastMessageAt: '2026-03-03T16:00:00Z', createdAt: '2026-02-28T09:00:00Z' },
  { id: 'c4', projectId: 'p1', manufacturerId: 'm6', manufacturerName: 'Milano Atelier SRL', subject: 'Cashmere blend availability', messages: [{ id: 'msg7', sender: 'user' as const, content: 'Do you have cashmere-cotton blends available for lightweight spring knits?', createdAt: '2026-03-08T10:00:00Z' }, { id: 'msg8', sender: 'manufacturer' as const, content: 'Yes, we offer a 30/70 cashmere-cotton blend at €28/meter. Minimum 200 meters. Available in 15 colors.', createdAt: '2026-03-09T09:15:00Z' }], status: 'reply_received' as const, lastMessageAt: '2026-03-09T09:15:00Z', createdAt: '2026-03-08T10:00:00Z' },
];

const reminders = [
  { id: 'r1', title: 'Follow up with Shanghai Textile on samples', description: 'Check if fabric swatches have arrived', dueDate: '2026-03-13', projectId: 'p1', projectName: 'Spring Collection 2026', completed: false, type: 'follow_up' },
  { id: 'r2', title: 'Denim supplier decision deadline', description: 'Need to finalize denim supplier by end of week', dueDate: '2026-03-14', projectId: 'p2', projectName: 'Denim Capsule Line', completed: false, type: 'deadline' },
  { id: 'r3', title: 'Review athleisure tech packs', description: 'Tech packs from design team due for review', dueDate: '2026-03-15', projectId: 'p3', projectName: 'Athleisure Basics', completed: false, type: 'task' },
  { id: 'r4', title: 'Kids line fabric testing results', description: 'Lab results expected for organic cotton testing', dueDate: '2026-03-16', projectId: 'p7', projectName: 'Organic Kids Line', completed: false, type: 'milestone' },
  { id: 'r5', title: 'Leather sample inspection', description: 'Inspect leather sample batch from Istanbul', dueDate: '2026-03-17', projectId: 'p6', projectName: 'Leather Accessories', completed: false, type: 'inspection' },
];

const quotes = [
  { id: 'q1', projectId: 'p1', projectName: 'Spring Collection 2026', manufacturerId: 'm1', manufacturerName: 'Shanghai Textile Co.', unitPrice: 12.50, moq: 500, leadTimeDays: 35, currency: 'USD', status: 'accepted' as const, validUntil: '2026-04-15', notes: 'Includes custom dye matching and eco-friendly packaging.', createdAt: '2026-02-20' },
  { id: 'q2', projectId: 'p2', projectName: 'Denim Capsule Line', manufacturerId: 'm5', manufacturerName: 'Dhaka Denim Corp.', unitPrice: 18.75, moq: 2000, leadTimeDays: 60, currency: 'USD', status: 'pending' as const, validUntil: '2026-04-01', notes: '14oz selvedge denim. Price includes washing and finishing.', createdAt: '2026-03-06' },
  { id: 'q3', projectId: 'p3', projectName: 'Athleisure Basics', manufacturerId: 'm3', manufacturerName: 'Hanoi Fashion Factory', unitPrice: 8.20, moq: 1000, leadTimeDays: 45, currency: 'USD', status: 'pending' as const, validUntil: '2026-04-10', notes: 'Performance cotton blend joggers. Bulk discount at 5,000+ units.', createdAt: '2026-03-04' },
  { id: 'q4', projectId: 'p6', projectName: 'Leather Accessories', manufacturerId: 'm4', manufacturerName: 'Istanbul Leather Works', unitPrice: 35.00, moq: 100, leadTimeDays: 30, currency: 'USD', status: 'accepted' as const, validUntil: '2026-05-01', notes: 'Full-grain Italian leather wallets and cardholders.', createdAt: '2026-02-15' },
  { id: 'q5', projectId: 'p1', projectName: 'Spring Collection 2026', manufacturerId: 'm6', manufacturerName: 'Milano Atelier SRL', unitPrice: 45.00, moq: 200, leadTimeDays: 40, currency: 'EUR', status: 'pending' as const, validUntil: '2026-04-20', notes: 'Cashmere-cotton blend lightweight knits.', createdAt: '2026-03-09' },
  { id: 'q6', projectId: 'p5', projectName: 'Winter Outerwear', manufacturerId: 'm11', manufacturerName: 'Shenzhen Tech Wear', unitPrice: 55.00, moq: 500, leadTimeDays: 50, currency: 'USD', status: 'rejected' as const, validUntil: '2025-12-01', notes: 'Insulated puffer jackets with recycled fill. Price too high.', createdAt: '2025-09-10' },
];

const samples = [
  { id: 's1', projectId: 'p1', projectName: 'Spring Collection 2026', manufacturerId: 'm1', manufacturerName: 'Shanghai Textile Co.', status: 'received' as const, trackingNumber: 'DHL-8847562910', photos: [], notes: 'Cotton quality excellent. Color slightly off on pastel rose — need re-dye.', requestedAt: '2026-02-25', receivedAt: '2026-03-08' },
  { id: 's2', projectId: 'p2', projectName: 'Denim Capsule Line', manufacturerId: 'm5', manufacturerName: 'Dhaka Denim Corp.', status: 'shipped' as const, trackingNumber: 'FEDEX-4423891057', photos: [], notes: '14oz selvedge sample pair in rigid wash.', requestedAt: '2026-03-01', receivedAt: undefined },
  { id: 's3', projectId: 'p6', projectName: 'Leather Accessories', manufacturerId: 'm4', manufacturerName: 'Istanbul Leather Works', status: 'approved' as const, trackingNumber: 'UPS-7756120384', photos: [], notes: 'Wallet craftsmanship is superb. Approved for production.', requestedAt: '2026-02-10', receivedAt: '2026-02-28' },
  { id: 's4', projectId: 'p3', projectName: 'Athleisure Basics', manufacturerId: 'm3', manufacturerName: 'Hanoi Fashion Factory', status: 'in_production' as const, photos: [], notes: 'Jogger sample in 3 colorways. Expected ship date: March 20.', requestedAt: '2026-03-05', receivedAt: undefined },
  { id: 's5', projectId: 'p7', projectName: 'Organic Kids Line', manufacturerId: 'm12', manufacturerName: 'Jaipur Handicrafts', status: 'requested' as const, photos: [], notes: 'Block-printed organic cotton onesies, sizes 6M-2T.', requestedAt: '2026-03-10', receivedAt: undefined },
];

const activity = [
  { id: 'a1', type: 'message_received', message: 'Received reply from Milano Atelier SRL regarding cashmere blends', description: 'Received reply from Milano Atelier SRL regarding cashmere blends', timestamp: '2026-03-09T09:15:00Z', projectId: 'p1', projectName: 'Spring Collection 2026', project: 'Spring Collection 2026' },
  { id: 'a2', type: 'sample_shipped', message: 'Denim sample shipped from Dhaka Denim Corp.', description: 'Denim sample shipped from Dhaka Denim Corp.', timestamp: '2026-03-08T14:00:00Z', projectId: 'p2', projectName: 'Denim Capsule Line', project: 'Denim Capsule Line' },
  { id: 'a3', type: 'quote_received', message: 'New quote received from Milano Atelier SRL — €45.00/unit', description: 'New quote received from Milano Atelier SRL — €45.00/unit', timestamp: '2026-03-09T08:00:00Z', projectId: 'p1', projectName: 'Spring Collection 2026', project: 'Spring Collection 2026' },
  { id: 'a4', type: 'sample_received', message: 'Fabric swatches arrived from Shanghai Textile Co.', description: 'Fabric swatches arrived from Shanghai Textile Co.', timestamp: '2026-03-08T11:30:00Z', projectId: 'p1', projectName: 'Spring Collection 2026', project: 'Spring Collection 2026' },
  { id: 'a5', type: 'message_sent', message: 'Sent tech pack request to Hanoi Fashion Factory', description: 'Sent tech pack request to Hanoi Fashion Factory', timestamp: '2026-03-03T16:00:00Z', projectId: 'p3', projectName: 'Athleisure Basics', project: 'Athleisure Basics' },
  { id: 'a6', type: 'quote_accepted', message: 'Accepted quote from Istanbul Leather Works for leather accessories', description: 'Accepted quote from Istanbul Leather Works for leather accessories', timestamp: '2026-03-02T10:00:00Z', projectId: 'p6', projectName: 'Leather Accessories', project: 'Leather Accessories' },
  { id: 'a7', type: 'project_created', message: 'New project created: Organic Kids Line', description: 'New project created: Organic Kids Line', timestamp: '2026-01-25T09:00:00Z', projectId: 'p7', projectName: 'Organic Kids Line', project: 'Organic Kids Line' },
  { id: 'a8', type: 'sample_approved', message: 'Leather wallet sample approved for production', description: 'Leather wallet sample approved for production', timestamp: '2026-02-28T15:00:00Z', projectId: 'p6', projectName: 'Leather Accessories', project: 'Leather Accessories' },
];

const dashboardStats = {
  activeProjects: 6,
  totalManufacturers: 12,
  manufacturersContacted: 8,
  pendingReplies: 3,
  upcomingReminders: 5,
  pipelineCounts: { ideation: 1, sourcing: 2, sampling: 1, production: 2, shipped: 1 },
  pipeline: { ideation: 1, sourcing: 2, sampling: 1, production: 2, shipped: 1 },
};

// Mock API handlers
export const mockApi = {
  dashboardStats: async () => dashboardStats,
  dashboardActivity: async () => activity,
  projectsList: async (_params?: any) => {
    const status = _params?.status;
    return status ? projects.filter((p) => p.status === status) : [...projects];
  },
  projectsGet: async (id: string) => projects.find((p) => p.id === id) ?? projects[0],
  projectsCreate: async (payload: any) => ({ id: 'p-new-' + Date.now(), ...payload, status: 'ideation', manufacturerCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), teamMembers: [] }),
  manufacturersList: async () => ({ data: manufacturers, nextCursor: null, hasMore: false }),
  manufacturersGet: async (id: string) => manufacturers.find((m) => m.id === id) ?? manufacturers[0],
  communicationsList: async () => communications,
  communicationsGet: async (id: string) => communications.find((c) => c.id === id) ?? communications[0],
  remindersList: async () => reminders,
  quotesList: async () => quotes,
  quotesGet: async (id: string) => quotes.find((q) => q.id === id) ?? quotes[0],
  samplesList: async (_params?: any) => {
    const status = _params?.status;
    return status ? samples.filter((s) => s.status === status) : [...samples];
  },
  designAssetsList: async () => [
    { id: 'da1', projectId: 'p1', name: 'Spring 2026 Color Palette.png', type: 'image', url: '#', thumbnailUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=400&h=300&fit=crop', uploadedAt: '2026-03-01', fileSize: 2400000 },
    { id: 'da2', projectId: 'p1', name: 'Cotton Fabric Swatches.jpg', type: 'image', url: '#', thumbnailUrl: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&h=300&fit=crop', uploadedAt: '2026-03-03', fileSize: 3100000 },
    { id: 'da3', projectId: 'p2', name: 'Denim Wash Spec Sheet.pdf', type: 'spec_sheet', url: '#', thumbnailUrl: '', uploadedAt: '2026-03-05', fileSize: 890000 },
    { id: 'da4', projectId: 'p1', name: 'Spring Mood Board.png', type: 'mood_board', url: '#', thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop', uploadedAt: '2026-02-28', fileSize: 4500000 },
    { id: 'da5', projectId: 'p6', name: 'Wallet CAD Model.step', type: 'cad', url: '#', thumbnailUrl: '', uploadedAt: '2026-02-20', fileSize: 12000000 },
    { id: 'da6', projectId: 'p3', name: 'Jogger Technical Drawing.pdf', type: 'document', url: '#', thumbnailUrl: '', uploadedAt: '2026-03-07', fileSize: 1500000 },
    { id: 'da7', projectId: 'p1', name: 'Pastel Linen Textures.jpg', type: 'image', url: '#', thumbnailUrl: 'https://images.unsplash.com/photo-1528459105426-b9548367069b?w=400&h=300&fit=crop', uploadedAt: '2026-03-04', fileSize: 2800000 },
    { id: 'da8', projectId: 'p2', name: 'Selvedge Denim Reference.jpg', type: 'image', url: '#', thumbnailUrl: 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=400&h=300&fit=crop', uploadedAt: '2026-03-06', fileSize: 1900000 },
    { id: 'da9', projectId: 'p7', name: 'Kids Block Print Patterns.png', type: 'image', url: '#', thumbnailUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop', uploadedAt: '2026-03-09', fileSize: 3300000 },
  ],
  aiGenerateDraft: async () => ({ draft: 'Dear Partner,\n\nThank you for your prompt response regarding our inquiry. We are pleased with the pricing and specifications provided.\n\nWe would like to proceed with a sample order to evaluate the quality firsthand. Could you please confirm the sample lead time and shipping arrangements?\n\nWe look forward to building a strong manufacturing partnership.\n\nBest regards,\nRAVI Team' }),
  aiVetManufacturer: async () => ({ overallScore: 82, categories: [{ name: 'Quality', score: 85, notes: 'Consistent quality across product lines' }, { name: 'Reliability', score: 78, notes: 'On-time delivery rate of 92%' }, { name: 'Communication', score: 80, notes: 'Responsive within 24 hours' }, { name: 'Sustainability', score: 88, notes: 'Strong environmental certifications' }], risks: ['Currency fluctuation exposure', 'Single-source dependency risk'], recommendations: ['Request third-party quality audit', 'Negotiate penalty clauses for late delivery'], generatedAt: new Date().toISOString() }),
  aiAnalyzeQuote: async () => ({ competitiveness: 'Above Average', marketComparison: 'This quote is 8% below market average for comparable products in the region.', negotiationTips: ['Request volume discount for orders above 5,000 units', 'Ask about payment terms (NET 30/60)', 'Inquire about bundled shipping rates'], recommendation: 'This is a competitive offer. Consider accepting with a request for extended payment terms.' }),
};
