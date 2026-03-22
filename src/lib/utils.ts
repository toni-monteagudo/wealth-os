import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ILiability } from "@/types";
import { differenceInMonths } from "date-fns";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function calculateRemainingBalance(loan: ILiability | any): number {
    if (!loan || !loan.initialCapital || !loan.termMonths || !loan.startDate) return 0;

    const annualRate = loan.tin !== undefined ? loan.tin : loan.interestRate;
    if (annualRate === undefined) return 0;

    const monthlyRate = (annualRate / 100) / 12;
    const months = loan.termMonths;
    const start = new Date(loan.startDate);
    const now = new Date();

    const monthsElapsed = differenceInMonths(now, start);
    if (monthsElapsed <= 0) return loan.initialCapital;
    if (monthsElapsed >= months) return 0;

    const paymentAmt = loan.monthlyPayment && loan.monthlyPayment > 0
        ? loan.monthlyPayment
        : monthlyRate > 0
            ? loan.initialCapital * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
            : loan.initialCapital / months;

    // PV of remaining payments = exact same formula the detail page uses
    const remainingMonths = months - monthsElapsed;
    if (monthlyRate > 0) {
        return paymentAmt * (1 - Math.pow(1 + monthlyRate, -remainingMonths)) / monthlyRate;
    }
    return paymentAmt * remainingMonths;
}
