// Mock data for demo mode (GitHub Pages / no backend)
// Manufacturers sourced from Alibaba, IndiaMart, and global supplier directories

import type { TechPack } from './api';

// Use real API if VITE_API_URL is set or running on localhost; otherwise demo mode
export const DEMO_MODE = !import.meta.env.VITE_API_URL && !window.location.hostname.includes('localhost');

const manufacturers = [
  { id: 'm1', name: 'Guangzhou Shang Ding Garment Co., Ltd.', country: 'China', specialties: ['T-Shirts', 'Hoodies', 'Streetwear'], certifications: ['ISO 9001', 'BSCI', 'OEKO-TEX'], rating: 4.6, verified: true, sustainabilityScore: 68, moq: 100, contacts: [{ id: 'ct1', name: 'Sales Team', email: 'sales@shangdinggarment.com', phone: '+86 20 8629 3500', role: 'sales' }], createdAt: '2024-01-15' },
  { id: 'm2', name: 'Tirupur Knits Pvt. Ltd.', country: 'India', specialties: ['Knitwear', 'Organic Cotton', 'Baby Clothing'], certifications: ['GOTS', 'Fair Trade', 'OEKO-TEX', 'ISO 14001'], rating: 4.3, verified: true, sustainabilityScore: 91, moq: 500, contacts: [{ id: 'ct2', name: 'Exports Dept', email: 'exports@tirupurknits.com', phone: '+91 421 243 8800', role: 'sales' }], createdAt: '2024-02-10' },
  { id: 'm3', name: 'Dongguan Humen Yihao Garment Factory', country: 'China', specialties: ['Dresses', 'Womens Wear', 'Fast Fashion'], certifications: ['ISO 9001', 'BSCI'], rating: 4.1, verified: true, sustainabilityScore: 55, moq: 200, contacts: [{ id: 'ct3', name: 'Info Desk', email: 'info@yihaogarment.com', phone: '+86 769 8566 2100', role: 'sales' }], createdAt: '2024-03-05' },
  { id: 'm4', name: 'Sialkot Sports Industries', country: 'Pakistan', specialties: ['Sportswear', 'Activewear', 'Soccer Uniforms'], certifications: ['ISO 9001', 'WRAP', 'OEKO-TEX'], rating: 4.4, verified: true, sustainabilityScore: 60, moq: 300, contacts: [{ id: 'ct4', name: 'Order Dept', email: 'order@sialkotsi.com', phone: '+92 52 358 0200', role: 'sales' }], createdAt: '2024-01-20' },
  { id: 'm5', name: 'Nisha Texport Pvt. Ltd.', country: 'Bangladesh', specialties: ['Denim', 'Woven Shirts', 'Chinos'], certifications: ['BSCI', 'OEKO-TEX', 'ISO 14001', 'SEDEX'], rating: 4.0, verified: true, sustainabilityScore: 72, moq: 3000, contacts: [{ id: 'ct5', name: 'Sourcing Team', email: 'sourcing@nishatexport.com', phone: '+880 2 8878 5500', role: 'sales' }], createdAt: '2024-04-12' },
  { id: 'm6', name: 'Lanificio Fratelli Cerruti', country: 'Italy', specialties: ['Luxury Wool', 'Suiting Fabrics', 'Cashmere'], certifications: ['ISO 9001', 'EMAS'], rating: 4.9, verified: true, sustainabilityScore: 88, moq: 50, contacts: [{ id: 'ct6', name: 'Commercial Dept', email: 'commercial@cerruti.it', phone: '+39 015 700 51', role: 'sales' }], createdAt: '2023-11-01' },
  { id: 'm7', name: 'Los Angeles Apparel', country: 'USA', specialties: ['Cut & Sew', 'Basics', 'Blank Apparel'], certifications: ['WRAP'], rating: 4.2, verified: false, sustainabilityScore: 78, moq: 72, contacts: [{ id: 'ct7', name: 'Wholesale Team', email: 'wholesale@losangelesapparel.net', phone: '+1 213 488 0226', role: 'sales' }], createdAt: '2024-05-20' },
  { id: 'm8', name: 'Jiangyin Longma Textile Co., Ltd.', country: 'China', specialties: ['Organic Cotton', 'Linen', 'Hemp Fabrics'], certifications: ['GOTS', 'OCS', 'GRS', 'OEKO-TEX'], rating: 4.5, verified: true, sustainabilityScore: 93, moq: 1000, contacts: [{ id: 'ct8', name: 'Trade Dept', email: 'trade@longmatextile.com', phone: '+86 510 8618 9900', role: 'sales' }], createdAt: '2024-06-15' },
  { id: 'm9', name: 'Shoe Connection Portugal Lda.', country: 'Portugal', specialties: ['Footwear', 'Leather Shoes', 'Sneakers'], certifications: ['ISO 9001', 'ISO 14001', 'SA8000'], rating: 4.7, verified: true, sustainabilityScore: 82, moq: 300, contacts: [{ id: 'ct9', name: 'Production Dept', email: 'production@shoeconnection.pt', phone: '+351 256 370 200', role: 'production' }], createdAt: '2024-02-28' },
  { id: 'm10', name: 'Guangzhou Boton Leather Goods Co., Ltd.', country: 'China', specialties: ['Leather Bags', 'Wallets', 'Accessories'], certifications: ['ISO 9001', 'BSCI', 'Disney FAMA'], rating: 4.3, verified: true, sustainabilityScore: 58, moq: 200, contacts: [{ id: 'ct10', name: 'Sales Team', email: 'sales@botonleather.com', phone: '+86 20 3479 6600', role: 'sales' }], createdAt: '2024-03-18' },
  { id: 'm11', name: 'Luthai Textile Co., Ltd.', country: 'China', specialties: ['Dress Shirts', 'Yarn-Dyed Fabrics', 'Premium Cotton'], certifications: ['ISO 9001', 'ISO 14001', 'OEKO-TEX', 'BSCI'], rating: 4.8, verified: true, sustainabilityScore: 76, moq: 3000, contacts: [{ id: 'ct11', name: 'International Sales', email: 'intl@luthai.com', phone: '+86 533 230 8888', role: 'sales' }], createdAt: '2024-07-01' },
  { id: 'm12', name: 'Rajlakshmi Cotton Mills Pvt. Ltd.', country: 'India', specialties: ['Handloom', 'Block Print', 'Natural Dyes'], certifications: ['GOTS', 'Fair Trade', 'GRS'], rating: 4.7, verified: true, sustainabilityScore: 96, moq: 100, contacts: [{ id: 'ct12', name: 'Connect Team', email: 'connect@rajlakshmimills.com', phone: '+91 33 2282 7700', role: 'sales' }], createdAt: '2024-01-08' },
];

const projects = [
  { id: 'p1', title: 'Spring Collection 2026', description: 'Lightweight cotton and linen pieces for the upcoming spring season. Focus on sustainable materials and pastel colorways.', status: 'production', _count: { communications: 2, quotes: 2, samples: 1, designAssets: 4 }, createdAt: '2025-09-15', updatedAt: '2026-03-08', teamMembers: [] },
  { id: 'p2', title: 'Denim Capsule Line', description: 'Premium selvedge denim jeans and jackets. Partnering with Japanese denim mills for raw materials.', status: 'sampling', _count: { communications: 1, quotes: 1, samples: 1, designAssets: 2 }, createdAt: '2025-11-01', updatedAt: '2026-03-10', teamMembers: [] },
  { id: 'p3', title: 'Athleisure Basics', description: 'Core basics range: joggers, hoodies, and t-shirts in performance cotton blends.', status: 'sourcing', _count: { communications: 1, quotes: 1, samples: 1, designAssets: 1 }, createdAt: '2026-01-10', updatedAt: '2026-03-09', teamMembers: [] },
  { id: 'p4', title: 'Resort Swim 2027', description: 'Early development of resort swimwear collection with recycled nylon fabrics.', status: 'ideation', _count: { communications: 0, quotes: 0, samples: 0, designAssets: 0 }, createdAt: '2026-02-20', updatedAt: '2026-03-05', teamMembers: [] },
  { id: 'p5', title: 'Winter Outerwear', description: 'Heavy-duty parkas, puffer jackets, and insulated vests for fall/winter.', status: 'shipped', _count: { communications: 0, quotes: 1, samples: 0, designAssets: 0 }, createdAt: '2025-06-01', updatedAt: '2026-02-15', teamMembers: [] },
  { id: 'p6', title: 'Leather Accessories', description: 'Small leather goods: wallets, cardholders, belts, and key fobs in full-grain Italian leather.', status: 'production', _count: { communications: 0, quotes: 1, samples: 1, designAssets: 1 }, createdAt: '2025-10-20', updatedAt: '2026-03-07', teamMembers: [] },
  { id: 'p7', title: 'Organic Kids Line', description: 'GOTS-certified organic cotton childrens clothing. Ages 2-10.', status: 'sourcing', _count: { communications: 0, quotes: 0, samples: 1, designAssets: 1 }, createdAt: '2026-01-25', updatedAt: '2026-03-11', teamMembers: [] },
];

const communications = [
  { id: 'c1', projectId: 'p1', manufacturerId: 'm8', subject: 'Organic cotton fabric samples for Spring 2026', body: 'Hi, we are interested in your GOTS-certified organic cotton in pastel colorways for our Spring 2026 collection. Can you send a swatch book?', direction: 'sent' as const, status: 'delivered' as const, sentAt: '2026-03-01T10:00:00Z', createdAt: '2026-03-01T10:00:00Z', manufacturer: { id: 'm8', name: 'Jiangyin Longma Textile Co., Ltd.', country: 'China' }, project: { id: 'p1', title: 'Spring Collection 2026' } },
  { id: 'c1b', projectId: 'p1', manufacturerId: 'm8', subject: 'Re: Organic cotton fabric samples for Spring 2026', body: 'Thank you for your inquiry. We have 32 pastel colorways available in our OC-200 organic cotton (180gsm). Swatch book shipped via DHL today — tracking number shared separately.', direction: 'received' as const, status: 'delivered' as const, sentAt: '2026-03-02T08:30:00Z', createdAt: '2026-03-02T08:30:00Z', manufacturer: { id: 'm8', name: 'Jiangyin Longma Textile Co., Ltd.', country: 'China' }, project: { id: 'p1', title: 'Spring Collection 2026' } },
  { id: 'c2', projectId: 'p2', manufacturerId: 'm5', subject: 'Selvedge denim pricing — 14oz raw', body: 'We are sourcing 14oz raw selvedge denim for a capsule line. Can you provide FOB pricing for 5,000 yards? Also interested in your laser finishing capabilities.', direction: 'sent' as const, status: 'sent' as const, sentAt: '2026-03-05T14:00:00Z', createdAt: '2026-03-05T14:00:00Z', manufacturer: { id: 'm5', name: 'Nisha Texport Pvt. Ltd.', country: 'India' }, project: { id: 'p2', title: 'Denim Capsule Line' } },
  { id: 'c3', projectId: 'p3', manufacturerId: 'm1', subject: 'Hoodie and jogger MOQ + lead times', body: 'What are your MOQs and lead times for 320gsm French terry hoodies and joggers? Need custom pantone matching.', direction: 'sent' as const, status: 'delivered' as const, sentAt: '2026-02-28T09:00:00Z', createdAt: '2026-02-28T09:00:00Z', manufacturer: { id: 'm1', name: 'Guangzhou Shang Ding Garment Co., Ltd.', country: 'China' }, project: { id: 'p3', title: 'Athleisure Basics' } },
  { id: 'c3b', projectId: 'p3', manufacturerId: 'm1', subject: 'Re: Hoodie and jogger MOQ + lead times', body: 'For hoodies: MOQ 100 pcs/color/size, 25-30 day production after sample approval. Joggers same MOQ, 25 days. Pantone matching available — $50 lab dip fee per color.', direction: 'received' as const, status: 'delivered' as const, sentAt: '2026-03-01T11:00:00Z', createdAt: '2026-03-01T11:00:00Z', manufacturer: { id: 'm1', name: 'Guangzhou Shang Ding Garment Co., Ltd.', country: 'China' }, project: { id: 'p3', title: 'Athleisure Basics' } },
  { id: 'c3c', projectId: 'p3', manufacturerId: 'm1', subject: 'Re: Hoodie and jogger MOQ + lead times', body: 'Great. Can you send us your tech pack template? We want to submit specs for 3 colorways.', direction: 'sent' as const, status: 'delivered' as const, sentAt: '2026-03-03T16:00:00Z', createdAt: '2026-03-03T16:00:00Z', manufacturer: { id: 'm1', name: 'Guangzhou Shang Ding Garment Co., Ltd.', country: 'China' }, project: { id: 'p3', title: 'Athleisure Basics' } },
  { id: 'c4', projectId: 'p1', manufacturerId: 'm6', subject: 'Cashmere blend availability — Spring knits', body: 'Do you have a cashmere-cotton blend suitable for lightweight spring knitwear? Looking for something around 200gsm.', direction: 'sent' as const, status: 'delivered' as const, sentAt: '2026-03-08T10:00:00Z', createdAt: '2026-03-08T10:00:00Z', manufacturer: { id: 'm6', name: 'Lanificio Fratelli Cerruti', country: 'Italy' }, project: { id: 'p1', title: 'Spring Collection 2026' } },
  { id: 'c4b', projectId: 'p1', manufacturerId: 'm6', subject: 'Re: Cashmere blend availability — Spring knits', body: 'We offer our Cerruti 1881 30/70 cashmere-Supima cotton blend at €32/meter, MOQ 150 meters. Available in 18 colors from our spring palette. Can ship sample cuts within 5 business days.', direction: 'received' as const, status: 'delivered' as const, sentAt: '2026-03-09T09:15:00Z', createdAt: '2026-03-09T09:15:00Z', manufacturer: { id: 'm6', name: 'Lanificio Fratelli Cerruti', country: 'Italy' }, project: { id: 'p1', title: 'Spring Collection 2026' } },
];

const reminders = [
  { id: 'r1', title: 'Follow up with Longma Textile on fabric swatches', description: 'Check if organic cotton swatch book has arrived via DHL', dueAt: '2026-03-13', projectId: 'p1', projectName: 'Spring Collection 2026', completed: false, type: 'follow_up' },
  { id: 'r2', title: 'Denim supplier decision deadline', description: 'Finalize between Nisha Texport and Luthai for selvedge denim', dueAt: '2026-03-14', projectId: 'p2', projectName: 'Denim Capsule Line', completed: false, type: 'deadline' },
  { id: 'r3', title: 'Review Shang Ding tech packs', description: 'Tech pack templates from Shang Ding need review before submitting specs', dueAt: '2026-03-15', projectId: 'p3', projectName: 'Athleisure Basics', completed: false, type: 'task' },
  { id: 'r4', title: 'Tirupur Knits fabric testing results', description: 'GOTS lab results expected for organic cotton baby wear fabrics', dueAt: '2026-03-16', projectId: 'p7', projectName: 'Organic Kids Line', completed: false, type: 'milestone' },
  { id: 'r5', title: 'Boton Leather sample inspection', description: 'Inspect wallet and cardholder samples from Guangzhou Boton', dueAt: '2026-03-17', projectId: 'p6', projectName: 'Leather Accessories', completed: false, type: 'inspection' },
];

const quotes = [
  { id: 'q1', projectId: 'p1', projectName: 'Spring Collection 2026', manufacturerId: 'm8', manufacturerName: 'Jiangyin Longma Textile Co., Ltd.', unitPrice: 4.20, moq: 1000, leadTimeDays: 30, currency: 'USD', status: 'accepted' as const, validityDate: '2026-04-15', notes: 'GOTS organic cotton fabric, 180gsm, custom dyed. Price per meter FOB Shanghai.', createdAt: '2026-02-20' },
  { id: 'q2', projectId: 'p2', projectName: 'Denim Capsule Line', manufacturerId: 'm5', manufacturerName: 'Nisha Texport Pvt. Ltd.', unitPrice: 22.50, moq: 3000, leadTimeDays: 60, currency: 'USD', status: 'pending' as const, validityDate: '2026-04-01', notes: '14oz raw selvedge denim jeans. Price per unit FOB Chittagong. Includes laser distressing and ozone wash.', createdAt: '2026-03-06' },
  { id: 'q3', projectId: 'p3', projectName: 'Athleisure Basics', manufacturerId: 'm1', manufacturerName: 'Guangzhou Shang Ding Garment Co., Ltd.', unitPrice: 8.80, moq: 100, leadTimeDays: 30, currency: 'USD', status: 'pending' as const, validityDate: '2026-04-10', notes: '320gsm French terry hoodie, custom pantone, screen print front + back. FOB Guangzhou.', createdAt: '2026-03-04' },
  { id: 'q4', projectId: 'p6', projectName: 'Leather Accessories', manufacturerId: 'm10', manufacturerName: 'Guangzhou Boton Leather Goods Co., Ltd.', unitPrice: 18.50, moq: 200, leadTimeDays: 25, currency: 'USD', status: 'accepted' as const, validityDate: '2026-05-01', notes: 'Full-grain leather bifold wallet with custom debossed logo. Includes gift box. FOB Guangzhou.', createdAt: '2026-02-15' },
  { id: 'q5', projectId: 'p1', projectName: 'Spring Collection 2026', manufacturerId: 'm6', manufacturerName: 'Lanificio Fratelli Cerruti', unitPrice: 52.00, moq: 150, leadTimeDays: 45, currency: 'EUR', status: 'pending' as const, validityDate: '2026-04-20', notes: 'Cashmere-Supima cotton blend lightweight knit sweater. Price per meter ex-works Biella.', createdAt: '2026-03-09' },
  { id: 'q6', projectId: 'p5', projectName: 'Winter Outerwear', manufacturerId: 'm3', manufacturerName: 'Dongguan Humen Yihao Garment Factory', unitPrice: 42.00, moq: 500, leadTimeDays: 45, currency: 'USD', status: 'rejected' as const, validityDate: '2025-12-01', notes: 'Insulated puffer jacket with recycled polyester fill. Price too high vs Pakistani suppliers.', createdAt: '2025-09-10' },
];

const samples = [
  { id: 's1', projectId: 'p1', projectName: 'Spring Collection 2026', manufacturerId: 'm8', manufacturerName: 'Jiangyin Longma Textile Co., Ltd.', status: 'received' as const, trackingNumber: 'DHL-8847562910', photos: [], notes: 'Organic cotton quality excellent. Pastel rose slightly warmer than pantone — requesting re-dip.', requestedAt: '2026-02-25', receivedAt: '2026-03-08' },
  { id: 's2', projectId: 'p2', projectName: 'Denim Capsule Line', manufacturerId: 'm5', manufacturerName: 'Nisha Texport Pvt. Ltd.', status: 'in_transit' as const, trackingNumber: 'FEDEX-4423891057', photos: [], notes: '14oz raw selvedge sample pair. Size 32. Rigid unwashed.', requestedAt: '2026-03-01', receivedAt: undefined },
  { id: 's3', projectId: 'p6', projectName: 'Leather Accessories', manufacturerId: 'm10', manufacturerName: 'Guangzhou Boton Leather Goods Co., Ltd.', status: 'approved' as const, trackingNumber: 'UPS-7756120384', photos: [], notes: 'Wallet stitching and leather quality is excellent. Logo deboss clean. Approved for production run.', requestedAt: '2026-02-10', receivedAt: '2026-02-28' },
  { id: 's4', projectId: 'p3', projectName: 'Athleisure Basics', manufacturerId: 'm1', manufacturerName: 'Guangzhou Shang Ding Garment Co., Ltd.', status: 'in_transit' as const, photos: [], notes: 'Hoodie sample in 3 pantone-matched colorways. Expected ship date: March 20.', requestedAt: '2026-03-05', receivedAt: undefined },
  { id: 's5', projectId: 'p7', projectName: 'Organic Kids Line', manufacturerId: 'm12', manufacturerName: 'Rajlakshmi Cotton Mills Pvt. Ltd.', status: 'requested' as const, photos: [], notes: 'Hand block-printed organic cotton onesies, sizes 6M-2T. Natural indigo and turmeric dyes.', requestedAt: '2026-03-10', receivedAt: undefined },
];

const activity = [
  { id: 'a1', type: 'message_received', message: 'Received pricing from Lanificio Fratelli Cerruti for cashmere blends', description: 'Received pricing from Lanificio Fratelli Cerruti for cashmere blends', timestamp: '2026-03-09T09:15:00Z', projectId: 'p1', projectName: 'Spring Collection 2026', project: 'Spring Collection 2026' },
  { id: 'a2', type: 'sample_shipped', message: 'Denim sample shipped from Nisha Texport Pvt. Ltd.', description: 'Denim sample shipped from Nisha Texport Pvt. Ltd.', timestamp: '2026-03-08T14:00:00Z', projectId: 'p2', projectName: 'Denim Capsule Line', project: 'Denim Capsule Line' },
  { id: 'a3', type: 'quote_received', message: 'New quote from Cerruti — €52.00/meter cashmere-cotton blend', description: 'New quote from Cerruti — €52.00/meter cashmere-cotton blend', timestamp: '2026-03-09T08:00:00Z', projectId: 'p1', projectName: 'Spring Collection 2026', project: 'Spring Collection 2026' },
  { id: 'a4', type: 'sample_received', message: 'Organic cotton swatches arrived from Jiangyin Longma Textile', description: 'Organic cotton swatches arrived from Jiangyin Longma Textile', timestamp: '2026-03-08T11:30:00Z', projectId: 'p1', projectName: 'Spring Collection 2026', project: 'Spring Collection 2026' },
  { id: 'a5', type: 'message_sent', message: 'Sent tech pack request to Guangzhou Shang Ding Garment', description: 'Sent tech pack request to Guangzhou Shang Ding Garment', timestamp: '2026-03-03T16:00:00Z', projectId: 'p3', projectName: 'Athleisure Basics', project: 'Athleisure Basics' },
  { id: 'a6', type: 'quote_accepted', message: 'Accepted Guangzhou Boton quote for leather wallets at $18.50/unit', description: 'Accepted Guangzhou Boton quote for leather wallets at $18.50/unit', timestamp: '2026-03-02T10:00:00Z', projectId: 'p6', projectName: 'Leather Accessories', project: 'Leather Accessories' },
  { id: 'a7', type: 'project_created', message: 'New project created: Organic Kids Line', description: 'New project created: Organic Kids Line', timestamp: '2026-01-25T09:00:00Z', projectId: 'p7', projectName: 'Organic Kids Line', project: 'Organic Kids Line' },
  { id: 'a8', type: 'sample_approved', message: 'Boton leather wallet sample approved for production', description: 'Boton leather wallet sample approved for production', timestamp: '2026-02-28T15:00:00Z', projectId: 'p6', projectName: 'Leather Accessories', project: 'Leather Accessories' },
];

const dashboardStats = {
  activeProjects: 6,
  totalManufacturers: 12,
  manufacturersContacted: 8,
  pendingReplies: 3,
  upcomingReminders: 5,
  pipeline: { ideation: 1, sourcing: 2, sampling: 1, production: 2, shipped: 1 },
};

let mockTechPacks: TechPack[] = [
  {
    id: 'tp-001',
    projectId: 'p1',
    name: 'Heritage Wool Blend Overcoat',
    category: 'Outerwear',
    season: 'FW26',
    status: 'review',
    materials: [
      { id: 'mat-1', name: 'Wool-Cashmere Twill', type: 'Shell', composition: '80% Wool / 20% Cashmere', color: 'Charcoal Melange', colorCode: '#3B3B3B', supplier: 'Loro Piana', costPerUnit: 48.50, unit: 'meter', placement: 'Body' },
      { id: 'mat-2', name: 'Cupro Bemberg', type: 'Lining', composition: '100% Cupro', color: 'Burgundy', colorCode: '#800020', supplier: 'Asahi Kasei', costPerUnit: 12.00, unit: 'meter', placement: 'Interior' },
      { id: 'mat-3', name: 'Horsehair Canvas', type: 'Interlining', composition: '100% Horsehair', color: 'Natural', supplier: 'Wendler', costPerUnit: 8.75, unit: 'meter', placement: 'Chest/Lapel' },
      { id: 'mat-4', name: 'Horn Buttons', type: 'Trim', color: 'Dark Horn', supplier: 'EUTrim GmbH', costPerUnit: 3.20, unit: 'piece', placement: 'Front closure' },
    ],
    measurements: [
      { id: 'meas-1', pointOfMeasure: 'Chest (cm)', sizes: { XS: 98, S: 102, M: 108, L: 114, XL: 120 }, tolerance: 1 },
      { id: 'meas-2', pointOfMeasure: 'Waist (cm)', sizes: { XS: 90, S: 94, M: 100, L: 106, XL: 112 }, tolerance: 1 },
      { id: 'meas-3', pointOfMeasure: 'Body Length (cm)', sizes: { XS: 102, S: 104, M: 106, L: 108, XL: 110 }, tolerance: 1 },
      { id: 'meas-4', pointOfMeasure: 'Sleeve Length (cm)', sizes: { XS: 62, S: 63.5, M: 65, L: 66.5, XL: 68 }, tolerance: 0.5 },
    ],
    construction: [
      { id: 'con-1', title: 'Seam Type', value: 'Open seam with 1.5 cm SA, pressed and edge-stitched', category: 'Seaming' },
      { id: 'con-2', title: 'Shoulder Construction', value: 'Half-canvas with hand-padded lapels', category: 'Structure' },
      { id: 'con-3', title: 'Pocket Style', value: 'Double-welt flap pockets, 1 interior welt pocket', category: 'Details' },
      { id: 'con-4', title: 'Hem Finish', value: 'Blind hem stitch, 4 cm turn-up', category: 'Finishing' },
    ],
    colorways: [
      { id: 'cw-1', name: 'Charcoal Melange', hexCode: '#3B3B3B', pantoneRef: '19-0201 TCX', status: 'approved' },
      { id: 'cw-2', name: 'Camel', hexCode: '#C19A6B', pantoneRef: '16-1334 TCX', status: 'approved' },
      { id: 'cw-3', name: 'Navy Herringbone', hexCode: '#1B2A4A', pantoneRef: '19-4028 TCX', status: 'pending' },
    ],
    labels: [
      { id: 'lbl-1', type: 'Main Label', text: 'Brand logo, woven damask on black satin ground', placement: 'Centre back neck' },
      { id: 'lbl-2', type: 'Care Label', text: 'Care symbols + composition EN/FR/DE/ES/IT', placement: 'Left side seam at waist', careSymbols: ['dry-clean-only', 'do-not-bleach', 'iron-low', 'do-not-tumble-dry'] },
      { id: 'lbl-3', type: 'Country of Origin', text: 'Made in Italy', placement: 'Below care label' },
    ],
    createdAt: '2026-02-10T09:00:00Z',
    updatedAt: '2026-03-08T14:30:00Z',
  },
  {
    id: 'tp-002',
    projectId: 'p1',
    name: 'Structured Linen Blazer',
    category: 'Tailoring',
    season: 'SS26',
    status: 'approved',
    materials: [
      { id: 'mat-5', name: 'Belgian Linen Plainweave', type: 'Shell', composition: '100% Linen', color: 'Sand', colorCode: '#D2B48C', supplier: 'Libeco', costPerUnit: 28.00, unit: 'meter', placement: 'Body' },
      { id: 'mat-6', name: 'Cotton-Linen Blend', type: 'Lining', composition: '60% Cotton / 40% Linen', color: 'Ecru Melange', supplier: 'Albini Group', costPerUnit: 9.50, unit: 'meter', placement: 'Interior' },
      { id: 'mat-7', name: 'Corozo Buttons', type: 'Trim', color: 'Natural Tan', supplier: 'BYK Buttons', costPerUnit: 2.10, unit: 'piece', placement: 'Front closure' },
    ],
    measurements: [
      { id: 'meas-5', pointOfMeasure: 'Chest (cm)', sizes: { XS: 96, S: 100, M: 106, L: 112, XL: 118 }, tolerance: 1 },
      { id: 'meas-6', pointOfMeasure: 'Body Length (cm)', sizes: { XS: 70, S: 72, M: 74, L: 76, XL: 78 }, tolerance: 1 },
      { id: 'meas-7', pointOfMeasure: 'Sleeve Length (cm)', sizes: { XS: 60, S: 61.5, M: 63, L: 64.5, XL: 66 }, tolerance: 0.5 },
    ],
    construction: [
      { id: 'con-5', title: 'Seam Type', value: 'Flat-felled seams, 1.2 cm SA', category: 'Seaming' },
      { id: 'con-6', title: 'Shoulder Construction', value: 'Unconstructed, natural shoulder with no padding', category: 'Structure' },
      { id: 'con-7', title: 'Pocket Style', value: 'Patch pockets with mitred corners, 1 interior welt pocket', category: 'Details' },
    ],
    colorways: [
      { id: 'cw-4', name: 'Sand', hexCode: '#D2B48C', pantoneRef: '14-1118 TCX', status: 'approved' },
      { id: 'cw-5', name: 'Dusty Blue', hexCode: '#6B8FAD', pantoneRef: '16-4120 TCX', status: 'approved' },
    ],
    labels: [
      { id: 'lbl-4', type: 'Main Label', text: 'Brand logo, woven on natural cotton', placement: 'Centre back neck' },
      { id: 'lbl-5', type: 'Care Label', text: 'Machine wash cold, hang dry', placement: 'Left side seam', careSymbols: ['machine-wash-cold', 'hang-dry', 'iron-medium', 'do-not-bleach'] },
    ],
    createdAt: '2026-01-20T11:00:00Z',
    updatedAt: '2026-03-05T10:15:00Z',
  },
  {
    id: 'tp-003',
    projectId: 'p3',
    name: 'Merino Turtleneck Sweater',
    category: 'Knitwear',
    season: 'FW26',
    status: 'draft',
    materials: [
      { id: 'mat-8', name: 'Extra-Fine Merino 19.5 mic', type: 'Yarn', composition: '100% Merino Wool', color: 'Midnight', colorCode: '#191970', supplier: 'Zegna Baruffa', costPerUnit: 24.00, unit: '380g', placement: 'Body' },
      { id: 'mat-9', name: 'Linking Thread', type: 'Thread', color: 'Midnight Match', supplier: 'Coats Group', costPerUnit: 0.60, unit: '80m', placement: 'Seams' },
    ],
    measurements: [
      { id: 'meas-8', pointOfMeasure: 'Chest (cm)', sizes: { XS: 94, S: 98, M: 104, L: 110, XL: 116 }, tolerance: 1 },
      { id: 'meas-9', pointOfMeasure: 'Body Length (cm)', sizes: { XS: 64, S: 66, M: 68, L: 70, XL: 72 }, tolerance: 1 },
      { id: 'meas-10', pointOfMeasure: 'Neck Height (cm)', sizes: { XS: 18, S: 18, M: 18.5, L: 18.5, XL: 19 }, tolerance: 0.5 },
    ],
    construction: [
      { id: 'con-8', title: 'Knit Gauge', value: '12 GG jersey body, 12 GG 2x2 rib at neck / cuffs / hem', category: 'Knitting' },
      { id: 'con-9', title: 'Linking', value: 'Fully-fashioned, 1x1 linked seams at shoulder and side', category: 'Seaming' },
      { id: 'con-10', title: 'Neck Construction', value: 'Tubular knit turtleneck, double-layer fold', category: 'Details' },
    ],
    colorways: [
      { id: 'cw-6', name: 'Midnight', hexCode: '#191970', pantoneRef: '19-3933 TCX', status: 'approved' },
      { id: 'cw-7', name: 'Ivory', hexCode: '#FFFFF0', pantoneRef: '11-0602 TCX', status: 'approved' },
      { id: 'cw-8', name: 'Bordeaux', hexCode: '#6B1C2A', pantoneRef: '19-1725 TCX', status: 'pending' },
    ],
    labels: [
      { id: 'lbl-6', type: 'Main Label', text: 'Printed heat-transfer logo on satin', placement: 'Centre back neck, inside turtleneck fold' },
      { id: 'lbl-7', type: 'Care Label', text: 'Hand wash cold, lay flat to dry', placement: 'Left side seam at hip', careSymbols: ['hand-wash-cold', 'lay-flat-dry', 'do-not-wring', 'cool-iron'] },
    ],
    createdAt: '2026-02-28T15:00:00Z',
    updatedAt: '2026-03-12T09:45:00Z',
  },
];

// Mock API handlers
export const mockApi = {
  dashboardStats: async () => dashboardStats,
  dashboardActivity: async () => activity,
  projectsList: async (_params?: any) => {
    const status = _params?.status;
    return status ? projects.filter((p) => p.status === status) : [...projects];
  },
  projectsGet: async (id: string) => projects.find((p) => p.id === id) ?? projects[0],
  projectsCreate: async (payload: any) => ({ id: 'p-new-' + Date.now(), ...payload, title: payload.title ?? payload.name, status: 'ideation', _count: { communications: 0, quotes: 0, samples: 0, designAssets: 0 }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), teamMembers: [] }),
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
    { id: 'da1', projectId: 'p1', fileName: 'Spring 2026 Color Palette.png', type: 'reference', fileUrl: '#', thumbnailUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=400&h=300&fit=crop', createdAt: '2026-03-01', tags: ['color', 'palette'] },
    { id: 'da2', projectId: 'p1', fileName: 'Organic Cotton Swatches.jpg', type: 'reference', fileUrl: '#', thumbnailUrl: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&h=300&fit=crop', createdAt: '2026-03-03', tags: ['cotton', 'swatch'] },
    { id: 'da3', projectId: 'p2', fileName: 'Denim Wash Spec Sheet.pdf', type: 'spec_sheet', fileUrl: '#', thumbnailUrl: '', createdAt: '2026-03-05', tags: ['denim', 'spec'] },
    { id: 'da4', projectId: 'p1', fileName: 'Spring Mood Board.png', type: 'moodboard', fileUrl: '#', thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop', createdAt: '2026-02-28', tags: ['mood', 'spring'] },
    { id: 'da5', projectId: 'p6', fileName: 'Wallet CAD Model.step', type: 'cad', fileUrl: '#', thumbnailUrl: '', createdAt: '2026-02-20', tags: ['cad', 'wallet'] },
    { id: 'da6', projectId: 'p3', fileName: 'Hoodie Technical Drawing.pdf', type: 'sketch', fileUrl: '#', thumbnailUrl: '', createdAt: '2026-03-07', tags: ['hoodie', 'tech-drawing'] },
    { id: 'da7', projectId: 'p1', fileName: 'Pastel Linen Textures.jpg', type: 'reference', fileUrl: '#', thumbnailUrl: 'https://images.unsplash.com/photo-1528459105426-b9548367069b?w=400&h=300&fit=crop', createdAt: '2026-03-04', tags: ['linen', 'texture'] },
    { id: 'da8', projectId: 'p2', fileName: 'Selvedge Denim Reference.jpg', type: 'reference', fileUrl: '#', thumbnailUrl: 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=400&h=300&fit=crop', createdAt: '2026-03-06', tags: ['denim', 'reference'] },
    { id: 'da9', projectId: 'p7', fileName: 'Kids Block Print Patterns.png', type: 'reference', fileUrl: '#', thumbnailUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop', createdAt: '2026-03-09', tags: ['kids', 'print'] },
  ],
  techpacks: {
    list: async (projectId: string) => mockTechPacks.filter((tp) => tp.projectId === projectId),
    get: async (id: string) => mockTechPacks.find((tp) => tp.id === id) ?? mockTechPacks[0],
    create: async (data: Partial<TechPack>) => {
      const newTp: TechPack = {
        id: 'tp-new-' + Date.now(),
        projectId: data.projectId || 'p1',
        name: data.name || 'Untitled Tech Pack',
        category: data.category,
        season: data.season,
        status: data.status || 'draft',
        materials: data.materials || [],
        measurements: data.measurements || [],
        construction: data.construction || [],
        colorways: data.colorways || [],
        labels: data.labels || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockTechPacks.push(newTp);
      return newTp;
    },
    update: async (id: string, data: Partial<TechPack>) => {
      const idx = mockTechPacks.findIndex((tp) => tp.id === id);
      if (idx !== -1) {
        mockTechPacks[idx] = { ...mockTechPacks[idx], ...data, updatedAt: new Date().toISOString() };
        return mockTechPacks[idx];
      }
      return mockTechPacks[0];
    },
    delete: async (id: string) => {
      mockTechPacks = mockTechPacks.filter((tp) => tp.id !== id);
    },
    duplicate: async (id: string, newName: string) => {
      const source = mockTechPacks.find((tp) => tp.id === id);
      if (!source) return mockTechPacks[0];
      const clone: TechPack = JSON.parse(JSON.stringify(source));
      clone.id = 'tp-dup-' + Date.now();
      clone.name = newName;
      clone.status = 'draft';
      clone.createdAt = new Date().toISOString();
      clone.updatedAt = new Date().toISOString();
      mockTechPacks.push(clone);
      return clone;
    },
  },
  aiGenerateDraft: async () => ({ draft: 'Dear Partner,\n\nThank you for your prompt response regarding our inquiry. We are pleased with the pricing and specifications provided.\n\nWe would like to proceed with a sample order to evaluate the quality firsthand. Could you please confirm the sample lead time and shipping arrangements?\n\nWe look forward to building a strong manufacturing partnership.\n\nBest regards,\nRAVI Team' }),
  aiVetManufacturer: async () => ({ overallScore: 82, categories: [{ name: 'Quality', score: 85, notes: 'Consistent quality across product lines' }, { name: 'Reliability', score: 78, notes: 'On-time delivery rate of 92%' }, { name: 'Communication', score: 80, notes: 'Responsive within 24 hours' }, { name: 'Sustainability', score: 88, notes: 'Strong environmental certifications' }], risks: ['Currency fluctuation exposure', 'Single-source dependency risk'], recommendations: ['Request third-party quality audit', 'Negotiate penalty clauses for late delivery'], generatedAt: new Date().toISOString() }),
  aiAnalyzeQuote: async () => ({ competitiveness: 'Above Average', marketComparison: 'This quote is 8% below market average for comparable products in the region.', negotiationTips: ['Request volume discount for orders above 5,000 units', 'Ask about payment terms (NET 30/60)', 'Inquire about bundled shipping rates'], recommendation: 'This is a competitive offer. Consider accepting with a request for extended payment terms.' }),
};
