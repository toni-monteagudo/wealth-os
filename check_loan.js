const mongoose = require('mongoose');

async function main() {
    await mongoose.connect('mongodb://localhost:27017/wealthos');
    const db = mongoose.connection;
    const loan = await db.collection('liabilities').findOne({ _id: new mongoose.Types.ObjectId("69b73887ceb058b1ab85959f") });
    console.log(JSON.stringify(loan, null, 2));
    process.exit(0);
}

main().catch(console.error);
