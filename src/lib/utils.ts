import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ILiability } from "@/types";
import { differenceInMonths } from "date-fns";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function calculateRemainingBalance(loan: ILiability | any): number {
    if (!loan || !loan.initialCapital || !loan.termMonths || !loan.startDate || loan.interestRate === undefined) return 0;
    
    const principal = loan.initialCapital;
    const monthlyRate = (loan.interestRate / 100) / 12;
    const months = loan.termMonths;
    const start = new Date(loan.startDate);
    const now = new Date();
    
    let paymentAmt = loan.monthlyPayment;
    if (!paymentAmt || paymentAmt <= 0) {
        paymentAmt = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    }

    const monthsElapsed = differenceInMonths(now, start);
    if (monthsElapsed <= 0) return principal;
    if (monthsElapsed >= months) return 0;

    let remainingBalance = principal;
    for (let i = 1; i <= monthsElapsed; i++) {
        const interestPayment = remainingBalance * monthlyRate;
        let principalPayment = paymentAmt - interestPayment;
        remainingBalance -= principalPayment;
    }
    return Math.max(0, remainingBalance);
}
