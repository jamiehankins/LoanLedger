var ledger = [];
function initData() {
  // Add all rate settings to ledger.
  for(i = 0; i < rates.length; ++i) {
    var item = [];
    item.date = parseDate(rates[i].date);
    item.rate = rates[i].rate;
    item.amount = null;
    ledger.push(item);
  }
  // Add all payments to ledger.
  for(i = 0; i < payments.length; ++i) {
    var item = [];
    item.date = parseDate(payments[i].date);
    item.rate = null;
    item.amount = payments[i].amount;
    ledger.push(item);
  }
  // Add a zero transaction to the end so that we get current balance.
  var item = [];
  item.date = new Date();
  // Set the date to the last second of the day
  // in case there's another transaction.
  item.date.setHours(23, 59, 59, 999);
  item.rate = null;
  item.amount = 0;
  ledger.push(item);
  // Sort the ledger by date, and put
  // rate changes before payments.
  ledger.sort(function(a, b) {
    var ret = 0;
    var aDate = a.date;
    var bDate = b.date;
    // For some reason, dates don't compare using !=.
    // Converting them to strings takes care of that.
    if(formatDate(aDate) != formatDate(bDate)) {
      ret = aDate < bDate ? -1 : 1;
    } else {
      if(a.rate != null && b.rate == null) {
        ret = -1;
      } else if(a.rate == null && b.rate != null) {
        ret = 1;
      } else if(a.amount != null && b.amount != null) {
        ret = a.amount > b.amount ? -1 : 1;
      }
    }
    return ret;
  });
}

var rowCounter = 0;

function getRow(extendRow = false, date = null) {
  var row = document.createElement('div');
  if(!extendRow) {
    ++rowCounter;
  }
  if(rowCounter % 2) {
    row.className = 'divTableRow alternateShading';
  } else {
    row.className = 'divTableRow';
  }
  if(date) {
    row.appendChild(getCol(formatDate(date)));
  } else {
    row.appendChild(getCol(''));
  }
  return row;
}

function parseDate(s) {
  var d = new Date();
  s = s.split('/');
  d.setFullYear(s[2], s[0] - 1, s[1]);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isLeapYear(year)
{
    return (year & 3) == 0 && ((year % 25) != 0 || (year & 15) == 0);
}

function treatAsUTC(date) {
  var result = new Date(date);
  result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
  return result;
}

function daysBetween(startDate, endDate) {
  var millisecondsPerDay = 24 * 60 * 60 * 1000;
  return ((treatAsUTC(endDate) - treatAsUTC(startDate)) / millisecondsPerDay).toFixed(0);
}

function formatDate(dateParam) {
  var date = new Date(dateParam);
  return (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
}

function formatDollars(amount) {
  return '$' + amount.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
}

function getNumberCol(val) {
  var valCol = document.createElement('div');
  valCol.className = 'divTableCell number';
  if(val != null) {
    valCol.innerHTML = val;
  }
  return valCol;  
}

function getCol(val) {
  var valCol = document.createElement('div');
  valCol.className = 'divTableCell';
  if(val != null) {
    valCol.innerHTML = val;
  }
  return valCol;
}

function calculateInterest(date, days, balance, rate) {
  var dailyRate = isLeapYear(date.getFullYear()) ? rate / 100 / 366 : rate / 100 / 365;
  var newBalance = balance * Math.pow(1 + dailyRate, days);
  return newBalance - balance;
}

function chargeInterest(date, days, balance, rate) {
  var dailyRate = isLeapYear(date.getFullYear()) ? rate / 100 / 366 : rate / 100 / 365;
  var newBalance = balance * Math.pow(1 + dailyRate, days);
  var interest = newBalance - balance;

  // Build interest charge row.
  var chargeRow = getRow(false, date);
  chargeRow.appendChild(getCol('Accrued Interest at ' + +rate.toFixed(6) + '% (' + days + ' days)'));
  chargeRow.appendChild(getNumberCol(formatDollars(interest)));
  chargeRow.appendChild(getCol(''));

  // Get ledger and add charge row.
  var ledgerElement = document.getElementById('ledger');
  ledgerElement.appendChild(chargeRow);

  return newBalance;
}

function changeInterest(balance, rate) {
  // Build interest change row.
  var changeRow = getRow(true);
  changeRow.appendChild(getCol('New Interest Rate (' + +rate.toFixed(6) + '%)'));
  changeRow.appendChild(getCol(''));
  changeRow.appendChild(getNumberCol(formatDollars(balance)));

  // Get ledger and add change row.
  var ledgerElement = document.getElementById('ledger');
  ledgerElement.appendChild(changeRow);
}

function applyPayment(date, days, balance, rate, amount) {
  // First, get the interest since the last balance.
  var interest = calculateInterest(date, days, balance, rate);
  // Next, get how this affects the balance.
  var balanceAdjustment = interest - amount;
  var newBalance = balanceAdjustment + balance;

  // First row will give accrued interest and days.
  var accruedRow = getRow(false, date);
  accruedRow.appendChild(getCol('Accrued Interest at ' + +rate.toFixed(6) + '% (' + days + ' days)'));
  accruedRow.appendChild(getNumberCol(formatDollars(interest)));
  accruedRow.appendChild(getCol(''));

  // Next row is the lessor of the payment and the accrued interest.
  var paidInterest = Math.min(amount, interest);
  var intRow = getRow(true);
  intRow.appendChild(getCol('Payment (Interest)'));
  intRow.appendChild(getNumberCol(formatDollars(paidInterest)));
  
  // Total row is the same regardless.
  var totalRow = getRow(true);
  totalRow.appendChild(getCol('Payment (Total)'));
  totalRow.appendChild(getNumberCol(formatDollars(amount)));
  totalRow.appendChild(getCol(''));

  // Next row is determined by whether outstanding interest
  // is covered by payment.
  var effectRow = getRow(true);
  if(balanceAdjustment < 0) {
    effectRow.appendChild(getCol('Payment (Principle)'));
    effectRow.appendChild(getNumberCol(formatDollars(amount - interest)));
    effectRow.appendChild(getNumberCol(formatDollars(newBalance)));
    intRow.appendChild(getCol(''));
  } else if(balanceAdjustment > 0) {
    effectRow.appendChild(getCol('Remaining Interest Applied'));
    effectRow.appendChild(getNumberCol(formatDollars(interest - amount)));
    effectRow.appendChild(getNumberCol(formatDollars(newBalance)));
    intRow.appendChild(getCol(''));
  } else {
    intRow.appendChild(getNumberCol(formatDollars(newBalance)));
  }  
  // Note that in the rare case where balanceAdjustment == 0,
  // we'll just do neither and skip the row mentioning principle
  // payment or interest accrual.

  // Get ledger and add rows.
  var ledgerElement = document.getElementById('ledger');
  ledgerElement.appendChild(accruedRow);
  ledgerElement.appendChild(totalRow); 
  ledgerElement.appendChild(intRow);
  ledgerElement.appendChild(effectRow);

  return newBalance;
}

function extendAdvance(date, amount, balance) {
  balance += amount;
  var advanceRow = getRow(false, date);
  advanceRow.appendChild(getCol('Loan Advance'));
  advanceRow.appendChild(getNumberCol(formatDollars(amount)));
  advanceRow.appendChild(getNumberCol(formatDollars(balance)));
  document.getElementById('ledger').appendChild(advanceRow);
  return balance;
}

function addCurrentBalance(date, balance) {
  var balanceRow = getRow(false, date);
  balanceRow.appendChild(getCol('Current Balance'));
  balanceRow.appendChild(getCol(''));
  balanceRow.appendChild(getNumberCol(formatDollars(balance)));
  document.getElementById('balance').appendChild(balanceRow);
}

function getIt() {
  var rate = initialRate;
  var prevDate = parseDate(initialDate);
  var balance = initialBalance;
  var ledgerElement = document.getElementById('ledger');

  var initialRow = getRow(false, initialDate);
  initialRow.appendChild(getCol('Initial Interest Rate (' + +rate.toFixed(6) + '%)'));
  initialRow.appendChild(getCol(''));
  initialRow.appendChild(getCol(''));
  ledgerElement.appendChild(initialRow);
  initialRow = getRow(true);
  initialRow.appendChild(getCol('Initial Balance'));
  initialRow.appendChild(getNumberCol(formatDollars(balance)));
  initialRow.appendChild(getNumberCol(formatDollars(balance)));
  ledgerElement.appendChild(initialRow);
  for(var i = 0; i < ledger.length; ++i) {
    var item = ledger[i];
    var newDate = item.date;
    var days = daysBetween(prevDate, newDate);
    if(item.rate != null && rate != ledger[i].rate) {
      if(days > 0) {
        balance = chargeInterest(newDate, days, balance, rate);
      }
      rate = item.rate;
      changeInterest(balance, rate);
      prevDate = newDate;
    } else if(item.amount != null) {
      if(item.amount <= 0) {
        if(days > 0) {
          balance = chargeInterest(newDate, days, balance, rate);
        }
        if(item.amount < 0) {
          balance = extendAdvance(newDate, -item.amount, balance);
        } else {
          addCurrentBalance(newDate, balance);
        }
      } else {
        balance = applyPayment(newDate, days, balance, rate, item.amount);        
      }
      prevDate = newDate;
    }
  }
}
