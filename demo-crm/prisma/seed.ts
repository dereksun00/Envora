import { PrismaClient, OrgSize, UserRole, DealStage, ActivityType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const industries = [
  "Technology", "Healthcare", "Finance", "Manufacturing", "Retail",
  "Education", "Real Estate", "Consulting", "Energy", "Media"
];

const orgNames = [
  "Nexus Technologies", "HealthBridge Solutions", "CapitalFlow Inc", "Precision Manufacturing Co",
  "RetailEdge Group", "EduSpark Learning", "Skyline Properties", "Catalyst Consulting",
  "GreenWatt Energy", "MediaPulse Studios"
];

const firstNames = [
  "James", "Emily", "Michael", "Sarah", "David", "Jessica", "Robert", "Ashley",
  "William", "Amanda", "Daniel", "Megan", "Christopher", "Lauren", "Matthew",
  "Rachel", "Andrew", "Nicole", "Joshua", "Stephanie", "Ryan", "Heather",
  "Brandon", "Elizabeth", "Tyler", "Samantha", "Kevin", "Victoria", "Nathan",
  "Christina", "Justin", "Rebecca", "Aaron", "Katherine", "Thomas", "Hannah",
  "Benjamin", "Olivia", "Alexander", "Sophia", "Ethan", "Isabella", "Noah",
  "Ava", "Lucas", "Mia", "Mason", "Charlotte", "Logan", "Harper"
];

const lastNames = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
  "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
  "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
  "Walker", "Young", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill",
  "Flores", "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell",
  "Mitchell", "Carter", "Roberts", "Phillips"
];

const titles = [
  "CEO", "CTO", "CFO", "VP of Sales", "VP of Engineering", "Director of Marketing",
  "Head of Product", "Sales Manager", "Account Executive", "Business Development Rep",
  "Marketing Manager", "Operations Director", "Chief Revenue Officer", "COO",
  "Head of Partnerships", "Customer Success Manager"
];

const dealNames = [
  "Enterprise License", "Platform Migration", "Annual Subscription", "Consulting Engagement",
  "Custom Integration", "Training Program", "Support Contract", "Cloud Deployment",
  "Data Analytics Suite", "Security Audit", "API Access", "White-Label Solution",
  "Managed Services", "Digital Transformation", "Proof of Concept", "Pilot Program",
  "Strategic Partnership", "Volume Licensing", "Premium Tier Upgrade", "Infrastructure Overhaul"
];

const activitySubjects = [
  "Discovery call", "Follow-up meeting", "Contract review", "Product demo",
  "Pricing discussion", "Technical deep dive", "Quarterly business review",
  "Onboarding kickoff", "Renewal discussion", "Proposal walkthrough",
  "Competitor comparison", "Budget alignment", "Stakeholder intro",
  "Implementation planning", "Success metrics review", "Executive briefing"
];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

const sizes: OrgSize[] = ["startup", "mid_market", "enterprise"];
const roles: UserRole[] = ["admin", "sales_manager", "sales_rep"];
const stages: DealStage[] = ["prospecting", "qualification", "proposal", "negotiation", "closed_won", "closed_lost"];
const activityTypes: ActivityType[] = ["call", "email", "meeting", "note"];

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.activity.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.demoAccount.deleteMany();

  // Create 10 organizations
  const orgs = [];
  for (let i = 0; i < 10; i++) {
    const org = await prisma.organization.create({
      data: {
        name: orgNames[i],
        industry: industries[i],
        size: sizes[i % 3],
        website: `https://${orgNames[i].toLowerCase().replace(/\s+/g, "")}.com`,
        createdAt: randomDate(new Date("2024-01-01"), new Date("2025-06-01")),
      },
    });
    orgs.push(org);
  }
  console.log(`✅ Created ${orgs.length} organizations`);

  // Create 50 users (5 per org)
  const users = [];
  for (let i = 0; i < 50; i++) {
    const org = orgs[i % 10];
    const fn = firstNames[i];
    const ln = lastNames[i];
    const user = await prisma.user.create({
      data: {
        name: `${fn} ${ln}`,
        email: `${fn.toLowerCase()}.${ln.toLowerCase()}@${org.name.toLowerCase().replace(/\s+/g, "")}.com`,
        role: i < 10 ? "admin" : i < 20 ? "sales_manager" : "sales_rep",
        organizationId: org.id,
        createdAt: randomDate(new Date("2024-01-01"), new Date("2025-06-01")),
      },
    });
    users.push(user);
  }
  console.log(`✅ Created ${users.length} users`);

  // Create 80 contacts (8 per org)
  const contacts = [];
  for (let i = 0; i < 80; i++) {
    const org = orgs[i % 10];
    const fn = firstNames[(i + 10) % firstNames.length];
    const ln = lastNames[(i + 15) % lastNames.length];
    const contact = await prisma.contact.create({
      data: {
        firstName: fn,
        lastName: ln,
        email: `${fn.toLowerCase()}.${ln.toLowerCase()}.${i}@${org.name.toLowerCase().replace(/\s+/g, "")}.com`,
        phone: `+1${randomInt(200, 999)}${randomInt(100, 999)}${randomInt(1000, 9999)}`,
        title: randomElement(titles),
        organizationId: org.id,
        createdAt: randomDate(new Date("2024-01-01"), new Date("2025-06-01")),
      },
    });
    contacts.push(contact);
  }
  console.log(`✅ Created ${contacts.length} contacts`);

  // Create 200 deals
  const deals = [];
  for (let i = 0; i < 200; i++) {
    const org = orgs[i % 10];
    const orgContacts = contacts.filter(c => c.organizationId === org.id);
    const orgUsers = users.filter(u => u.organizationId === org.id);
    const contact = randomElement(orgContacts);
    const owner = randomElement(orgUsers);
    const stage = randomElement(stages);
    const amount = stage === "closed_won"
      ? randomInt(10000, 500000)
      : stage === "closed_lost"
        ? randomInt(5000, 200000)
        : randomInt(5000, 1000000);

    const deal = await prisma.deal.create({
      data: {
        name: `${randomElement(dealNames)} - ${org.name.split(" ")[0]} #${i + 1}`,
        amount,
        stage,
        closeDate: randomDate(new Date("2025-01-01"), new Date("2025-12-31")),
        organizationId: org.id,
        contactId: contact.id,
        ownerId: owner.id,
        createdAt: randomDate(new Date("2024-06-01"), new Date("2025-06-01")),
      },
    });
    deals.push(deal);
  }
  console.log(`✅ Created ${deals.length} deals`);

  // Create 300 activities
  for (let i = 0; i < 300; i++) {
    const deal = Math.random() > 0.2 ? randomElement(deals) : null;
    const contact = deal
      ? contacts.find(c => c.id === deal.contactId) || randomElement(contacts)
      : randomElement(contacts);
    const user = deal
      ? users.find(u => u.id === deal.ownerId) || randomElement(users)
      : randomElement(users);

    await prisma.activity.create({
      data: {
        type: randomElement(activityTypes),
        subject: randomElement(activitySubjects),
        description: Math.random() > 0.5 ? `Notes from ${randomElement(activitySubjects).toLowerCase()} regarding ${deal?.name || "general inquiry"}` : null,
        date: randomDate(new Date("2025-01-01"), new Date("2025-12-31")),
        dealId: deal?.id || null,
        contactId: contact.id,
        userId: user.id,
        createdAt: randomDate(new Date("2024-06-01"), new Date("2025-06-01")),
      },
    });
  }
  console.log(`✅ Created 300 activities`);

  // Create demo account
  await prisma.demoAccount.create({
    data: {
      email: "demo@acmecrm.com",
      name: "Demo User",
      role: "admin",
    },
  });
  console.log(`✅ Created demo account`);

  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
