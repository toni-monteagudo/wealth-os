const { differenceInMonths, addMonths } = require('date-fns');

const principal = 58300;
const annualRate = 2;
const months = 240;
const start = new Date('2019-06-14');
const now = new Date('2026-03-16');

const monthlyRate = (annualRate / 100) / 12;

const theoreticalPmt = monthlyRate > 0 
    ? principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
    : principal / months;

const monthsElapsed = differenceInMonths(now, start);
const currentIndex = Math.max(0, Math.min(monthsElapsed - 1, months - 1));
const remainingMonths = months - currentIndex - 1;

const loan = { monthlyPayment: 267.52 };
const validMonthlyPmt = loan.monthlyPayment && loan.monthlyPayment > 0 ? loan.monthlyPayment : theoreticalPmt;

let deducedCurrentBalance = 0;
if (validMonthlyPmt > 0 && monthlyRate > 0 && remainingMonths > 0) {
    deducedCurrentBalance = validMonthlyPmt * (1 - Math.pow(1 + monthlyRate, -remainingMonths)) / monthlyRate;
}

const schedule = [];
let activeBalance = principal;
let activePmt = theoreticalPmt;

for (let i = 1; i <= months; i++) {
    const interestPayment = activeBalance * monthlyRate;
    let principalPayment = activePmt - interestPayment;
    let nextBalance = activeBalance - principalPayment;

    let isTransition = false;
    if (i === currentIndex + 1 && deducedCurrentBalance > 0 && Math.abs(deducedCurrentBalance - nextBalance) > 100) {
        nextBalance = deducedCurrentBalance;
        isTransition = true;
    }

    if (i === months || nextBalance < 0.01) {
        principalPayment = activeBalance;
        activePmt = principalPayment + interestPayment;
        nextBalance = 0;
    }

    const paymentDate = addMonths(start, i);

    schedule.push({
        month: i,
        date: paymentDate,
        payment: activePmt,
        principalPayment,
        interestPayment,
        remainingBalance: Math.max(0, nextBalance)
    });

    activeBalance = nextBalance;
    if (isTransition) {
        activePmt = validMonthlyPmt;
    }

    if (activeBalance <= 0) break;
}

const currentRow = schedule[currentIndex];
console.log('Current row (Month ' + currentRow.month + ') remaining balance:', currentRow.remainingBalance);
console.log('Deduced Balance:', deducedCurrentBalance);
console.log('Month 81 (Index 80) item:', schedule[80]);
console.log('Month 82 (Index 81) item:', schedule[81]);
