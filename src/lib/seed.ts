import dbConnect from "./mongodb";
import Asset from "@/models/Asset";
import Liability from "@/models/Liability";
import Transaction from "@/models/Transaction";
import Reserve from "@/models/Reserve";
import Project from "@/models/Project";
import Document from "@/models/Document";

export async function seedDatabase() {
    await dbConnect();

    // Check if already seeded
    const count = await Asset.countDocuments();
    if (count > 0) {
        console.log("Database already seeded");
        return;
    }

    console.log("Seeding database...");

    // 1. Assets
    const loft = await Asset.create({
        name: "Barcelona Loft",
        type: "real_estate",
        value: 850000,
        location: "Poble Sec, Barcelona",
        purchasePrice: 625000,
        purchaseDate: "2021-10-15",
        area: 120,
        image: "https://images.unsplash.com/photo-1554995207-c18c203602cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        rentalYield: 6.2,
        tenants: [
            {
                name: "Marc & Ana",
                contractUntil: "Dic 2025",
                monthlyRent: 4400,
            }
        ]
    });

    const saas = await Asset.create({
        name: "SaaS Ventures",
        type: "business",
        value: 1200000,
        mrr: 45000,
        momGrowth: 8.4,
        monthlyPayroll: 18000,
        employees: [
            { name: "Dev 1", avatar: "avatar1.png" },
            { name: "Dev 2", avatar: "avatar2.png" },
            { name: "Support", avatar: "avatar3.png" },
        ]
    });

    // 2. Liabilities
    await Liability.create({
        name: "Hipoteca Activa",
        type: "mortgage",
        balance: 400000,
        interestRate: 3.2,
        monthlyPayment: 1850,
        bank: "Banco Santander",
        loanNumber: "#9921",
        linkedAssetId: loft._id,
    });

    // 3. Reserves
    await Reserve.create([
        {
            name: "Tax Vault (VAT/IRPF)",
            type: "tax",
            balance: 12450,
            target: 14500,
            dueDate: "2024-10-20",
            allocationPercent: 21,
        },
        {
            name: "Maintenance",
            type: "maintenance",
            balance: 8200,
            target: 15000,
            allocationPercent: 5,
            linkedAssetId: loft._id,
        },
        {
            name: "Fondo de Emergencia",
            type: "emergency",
            balance: 25000,
            target: 25000,
        }
    ]);

    // 4. Projects
    await Project.create({
        name: "BCN Loft Renovation",
        description: "Kitchen & Bathroom upgrade",
        linkedAssetId: loft._id,
        budget: 120000,
        actualSpent: 85000,
        progress: 70,
        capitalize: true,
        estimatedEnd: "2023-11-15",
        expenses: [
            { concept: "Azulejos Porcelánicos", category: "Acabados", provider: "Porcelanosa S.A.", status: "Pagado", amount: 12450 },
            { concept: "Mobiliario Cocina", category: "Mobiliario", provider: "IKEA Business", status: "Depósito", amount: 8200 },
            { concept: "Iluminación LED", category: "Electricidad", provider: "Amazon Business", status: "Pagado", amount: 2150 },
            { concept: "Instalación Fontanería", category: "Instalación", provider: "Reformas García", status: "Pagado", amount: 4500 },
            { concept: "Cuadro Eléctrico Nuevo", category: "Electricidad", provider: "ElecBarna SL", status: "Pendiente", amount: 3800 },
        ],
        notes: [
            { text: "Retraso en entrega de cocina", date: "Hoy, 10:30 AM", isImportant: true },
            { text: "Finalizada instalación eléctrica", date: "Ayer, 16:45 PM", isImportant: false },
            { text: "Inicio de demolición", date: "12 Oct", isImportant: false },
        ]
    });

    // 5. Documents
    await Document.create([
        { name: "Property Deed", type: "property", entity: "BCN Loft", fileType: "PDF", status: "verified", uploadDate: "12 Oct" },
        { name: "SaaS Inccorp", type: "legal", entity: "Delaware", fileType: "PDF", status: "active", uploadDate: "05 Sep" },
        { name: "Insurance Policy", type: "insurance", entity: "AXA Seguros", fileType: "PDF", status: "active", uploadDate: "01 Jan", expirationDate: "2023-10-30" },
        { name: "DNI / Pasaporte", type: "legal", entity: "Identidad", fileType: "JPG", status: "active", uploadDate: "2020", expirationDate: "2028-05-10" },
    ]);

    // 6. Transactions
    await Transaction.create([
        { date: "24 OCT", description: "Préstamo Hipotecario 0049", amount: -1245, category: "AMORTIZATION", tags: ["HIPOTECA"], status: "needs_review", source: "csv_import", processingTime: "4h ago" },
        { date: "22 OCT", description: "Nómina TechCorp SL", amount: 4850, category: "REVENUE", tags: ["SALARIO", "INGRESO"], status: "needs_review", source: "csv_import", processingTime: "2m ago" },
        { date: "21 OCT", description: "Transferencia a Bóveda Fiscal", amount: -1020, category: "INTERNAL", tags: ["PROVISIÓN IMPUESTOS"], status: "confirmed", source: "manual" },
        { date: "20 OCT", description: "Amazon ES H8812", amount: -89.90, category: "EXPENSE", tags: ["GASTOS"], status: "confirmed", source: "manual" },
    ]);

    console.log("Database seeding completed!");
}
