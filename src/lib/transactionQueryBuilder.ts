export function buildTransactionQuery(searchParams: URLSearchParams): Record<string, any> {
    const query: Record<string, any> = {};

    const status = searchParams.get("status");
    if (status) query.status = status;

    const linkedAssetId = searchParams.get("linkedAssetId");
    if (linkedAssetId) query.linkedAssetId = linkedAssetId;

    const linkedProjectId = searchParams.get("linkedProjectId");
    if (linkedProjectId) query.linkedProjectId = linkedProjectId;

    const category = searchParams.get("category");
    if (category) query.category = category;

    const search = searchParams.get("search");
    if (search) {
        query.$or = [
            { description: { $regex: search, $options: "i" } },
            { friendlyDescription: { $regex: search, $options: "i" } },
        ];
    }

    // Date range (string comparison works for YYYY-MM-DD format)
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    if (dateFrom || dateTo) {
        query.date = {};
        if (dateFrom) query.date.$gte = dateFrom;
        if (dateTo) query.date.$lte = dateTo;
    }

    // Amount type (income/expense)
    const amountType = searchParams.get("amountType");
    if (amountType === "income") {
        query.amount = { $gt: 0 };
    } else if (amountType === "expense") {
        query.amount = { $lt: 0 };
    }

    // Amount range (merge with existing amount constraints from amountType)
    const amountMin = searchParams.get("amountMin");
    const amountMax = searchParams.get("amountMax");
    if (amountMin || amountMax) {
        if (!query.amount) query.amount = {};
        if (amountMin) query.amount.$gte = parseFloat(amountMin);
        if (amountMax) query.amount.$lte = parseFloat(amountMax);
    }

    return query;
}
