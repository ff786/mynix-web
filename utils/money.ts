const lkr = new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 2 });

/** "LKR 4,500.00" */
export const formatLkr = (amount: number) => lkr.format(amount);
