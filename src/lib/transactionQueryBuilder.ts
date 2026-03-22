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

    // Amount type and range filtering
    // Expenses are stored as negative values, but users filter by absolute value
    const amountType = searchParams.get("amountType");
    const amountMin = searchParams.get("amountMin");
    const amountMax = searchParams.get("amountMax");
    const min = amountMin ? parseFloat(amountMin) : null;
    const max = amountMax ? parseFloat(amountMax) : null;

    if (amountType === "income") {
        const amountQuery: Record<string, number> = { $gt: 0 };
        if (min) amountQuery.$gte = min;
        if (max) amountQuery.$lte = max;
        query.amount = amountQuery;
    } else if (amountType === "expense") {
        // Negate user values: user enters 100-500, we query -500 to -100
        const amountQuery: Record<string, number> = { $lt: 0 };
        if (min) amountQuery.$lte = -min;
        if (max) amountQuery.$gte = -max;
        query.amount = amountQuery;
    } else if (min || max) {
        // No type selected: filter by absolute value using $or for both signs
        if (min && max) {
            const amountOr = [
                { amount: { $gte: min, $lte: max } },
                { amount: { $gte: -max, $lte: -min } },
            ];
            if (query.$or) {
                // search $or already exists, combine with $and
                query.$and = [{ $or: query.$or }, { $or: amountOr }];
                delete query.$or;
            } else {
                query.$or = amountOr;
            }
        } else if (min) {
            // abs(amount) >= min
            const amountOr = [
                { amount: { $gte: min } },
                { amount: { $lte: -min } },
            ];
            if (query.$or) {
                query.$and = [{ $or: query.$or }, { $or: amountOr }];
                delete query.$or;
            } else {
                query.$or = amountOr;
            }
        } else if (max) {
            // abs(amount) <= max — this is just amount between -max and max
            query.amount = { $gte: -max, $lte: max };
        }
    } else if (amountType) {
        // amountType set but no min/max — shouldn't reach here but guard
    }

    return query;
}
