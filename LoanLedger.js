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

function formatDate(date) {
  return (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
}

function formatDollars(amount) {
  return '$' + amount.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
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
  var chargeRow = document.createElement('div');
  chargeRow.className = 'divTableRow';
  chargeRow.appendChild(getCol(formatDate(date)));
  chargeRow.appendChild(getCol('Accrued Interest (' + days + ' days)'));
  chargeRow.appendChild(getCol(formatDollars(interest)));
  chargeRow.appendChild(getCol(formatDollars(newBalance)));

  // Get ledger and add charge row.
  var ledgerElement = document.getElementById('ledger');
  ledgerElement.appendChild(chargeRow);

  return newBalance;
}

function changeInterest(date, rate) {
  // Build interest change row.
  var changeRow = document.createElement('div');
  changeRow.className = 'divTableRow';
  changeRow.appendChild(getCol(formatDate(date)));
  changeRow.appendChild(getCol('New Interest Rate'));
  changeRow.appendChild(getCol(rate.toFixed(2) + '%'));
  changeRow.appendChild(getCol(''));

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
  var accruedRow = document.createElement('div');
  accruedRow.className = 'divTableRow';
  accruedRow.appendChild(getCol(formatDate(date)));
  accruedRow.appendChild(getCol('Accrued Interest (' + days + ' days)'));
  accruedRow.appendChild(getCol(formatDollars(interest)));
  accruedRow.appendChild(getCol(''));

  // Next row is the same regardless of whether the payment
  // is more than the accrued interest.
  var intRow = document.createElement('div');
  intRow.className = 'divTableRow';
  intRow.appendChild(getCol(''));
  intRow.appendChild(getCol('Payment (Interest)'));
  intRow.appendChild(getCol(formatDollars(interest)));
  intRow.appendChild(getCol(''));
  
  // Next row is determined by whether outstanding interest
  // is covered by payment.
  var effectRow = document.createElement('div');
  effectRow.classList = 'divTableRow';
  if(balanceAdjustment < 0) {
    effectRow.appendChild(getCol(''));
    effectRow.appendChild(getCol('Payment (Principle)'));
    effectRow.appendChild(getCol(formatDollars(amount - interest)));
    effectRow.appendChild(getCol(''));
  } else if(balanceAdjustment > 0) {
    effectRow.appendChild(getCol(''));
    effectRow.appendChild(getCol('Remaining Interest Applied'));
    effectRow.appendChild(getCol(formatDollars(interest - amount)));
    effectRow.appendChild(getCol(''));
  }
  // Note that in the rare case where balanceAdjustment == 0,
  // we'll just do neither and skip the row mentioning principle
  // payment or interest accrual.

  // Total row is the same regardless.
  var totalRow = document.createElement('div');
  totalRow.className = 'divTableRow';
  totalRow.appendChild(getCol(formatDate(date)));
  totalRow.appendChild(getCol('Payment (Total)'));
  totalRow.appendChild(getCol(formatDollars(amount)));
  totalRow.appendChild(getCol(formatDollars(newBalance)));

    // Get ledger and add rows.
    var ledgerElement = document.getElementById('ledger');
    ledgerElement.appendChild(accruedRow);
    ledgerElement.appendChild(intRow);
    ledgerElement.appendChild(effectRow);
    ledgerElement.appendChild(totalRow); 

  return newBalance;
}

function extendAdvance(date, amount, balance) {
  var advanceRow = document.createElement('div');
  balance += amount;
  advanceRow.className = 'divTableRow';
  advanceRow.appendChild(getCol(formatDate(date)));
  advanceRow.appendChild(getCol('Loan Advance'));
  advanceRow.appendChild(getCol(formatDollars(amount)));
  advanceRow.appendChild(getCol(formatDollars(balance)));
  document.getElementById('ledger').appendChild(advanceRow);
  return balance;
}


function getIt() {
  var rate = initialRate;
  var prevDate = parseDate("7/27/2016");
  var balance = initialBalance;

  var initialRow = document.createElement('div');
  initialRow.className = 'divTableRow';
  initialRow.appendChild(getCol(formatDate(prevDate)));
  initialRow.appendChild(getCol('Initial Balance'));
  initialRow.appendChild(getCol(''));
  initialRow.appendChild(getCol(formatDollars(balance)));
  document.getElementById('ledger').appendChild(initialRow);
  for(var i = 0; i < ledger.length; ++i) {
    var item = ledger[i];
    if(item.rate != null && rate != ledger[i].rate) {
      var newDate = item.date;
      var days = daysBetween(prevDate, newDate);
      balance = chargeInterest(newDate, days, balance, rate);
      rate = item.rate;
      changeInterest(newDate, rate);
      prevDate = newDate;
    } else if(item.amount != null) {
      var newDate = item.date;
      var days = daysBetween(prevDate, newDate);
      if(item.amount < 0)
      {
        if(days > 0)
        {
          balance = chargeInterest(newDate, days, balance, rate);
        }
        balance = extendAdvance(newDate, -item.amount, balance);
      } else {
        balance = applyPayment(newDate, days, balance, rate, item.amount);        
      }
      prevDate = newDate;
    }
  }
}
