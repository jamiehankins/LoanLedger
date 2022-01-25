function initData() {
  var ledger = [];
  // First, sort the interest rates.
  rates.sort(function(a, b) {
    var ret = new Date(a.date) - new Date(b.date);
    if(0 === ret) {
      ret = a.rate > b.rate ? -1 : 1;
    }
    return ret;
  });
  // Then, add all rate settings to ledger.
  for(i = 0; i < rates.length; ++i) {
    var item = [];
    item.type = 'rateChange';
    item.date = parseDate(rates[i].date);
    item.rate = rates[i].rate;
    ledger.push(item);
  }
  // Next, sort the advances.
  advances.sort(function(a, b) {
    var ret = new Date(a.date) - new Date(b.date);
    if(0 === ret) {
      ret = a.amount > b.amount ? -1 : 1;
    }
    return ret;
  });
  // Then, add all advances to ledger.
  for(i = 0; i < advances.length; ++i) {
    var item = [];
    item.type = 'advance';
    item.date = parseDate(advances[i].date);
    item.amount = advances[i].amount;
    ledger.push(item);
  }
  // Next, sort the payments.
  payments.sort(function(a, b) {
    var ret = new Date(a.date) - new Date(b.date);
    if(0 === ret) {
      ret = a.amount > b.amount ? -1 : 1;
    }
    return ret;
  });
  // Finally, add all payments to ledger.
  for(i = 0; i < payments.length; ++i) {
    var item = [];
    item.type = 'payment'
    item.date = parseDate(payments[i].date);
    item.amount = payments[i].amount;
    ledger.push(item);
  }
  // Add a zero transaction to the end so that we get current balance.
  var item = [];
  item.type = 'terminator';
  item.date = new Date();
  // Set the date to the last milisecond of the day
  // in case there's another transaction on the last day.
  item.date.setHours(23, 59, 59, 999);
  item.rate = null;
  item.amount = 0;
  ledger.push(item);
  // Sort the ledger by date, put rate changes before advances, and advances
  // before payments.
  ledger.sort(function(a, b) {
    var ret = new Date(a.date) - new Date(b.date);
    if(0 === ret) {
      if(a.type != b.type) {
        // Only continue if the types don't match. Otherwise, let it be zero.
        if(a.type === 'rateChange' || b.type === 'rateChange') {
          // If it's a rate change, that goes first.
          ret = a.type === 'rateChange' ? -1 : 1;
        } else if(a.type === 'advance' || b.type === 'advance') {
          // Advances go next.
          ret = a.type === 'advance' ? -1 : 1;
        } else {
          // Payments go last.
          // We want this to be deterministic, so we'll sort by amount.
          ret = a.amount > b.amount ? -1: 1;
        }
      } else {
        // We want this to be deterministic, so we'll sort by amount or rate.
        if(a.type === 'rateChange') {
          ret = a.rate > b.rate ? -1 : 1;
        } else {
          ret = a.amount > b.amount ? -1: 1;      
        }
      }
    }
    return ret;
  });
  calculateValues(ledger);
  return ledger;
}

function calculateValues(ledger) {
  var prevDate = ledger[0].date;
  var rate = 0;
  var balance = 0;
  for(var i = 0; i < ledger.length; ++i) {
    var item = ledger[i];

    switch(item.type) {
    case 'rateChange':
      balance = calculateInterestChange(item, prevDate, rate, balance, rate);
      rate = item.rate;
      break;
    case 'advance':
      item.rate = rate;
      balance = calculateAdvance(item, prevDate, balance);
      break;
    case 'payment':
      item.rate = rate;
      balance = calculatePayment(item, prevDate, balance);
      break;
    case 'terminator':
      item.rate = rate;
      balance = calculateBalance(item, prevDate, rate, balance);
      break;
    }
    prevDate = item.date;
  }
}

function calculateInterestChange(item, prevDate, prevRate, balance) {
  item.balance = calculateBalance(item, prevDate, prevRate, balance);
  item.oldRate = prevRate;
  return item.balance;
}

function calculateAdvance(item, prevDate, balance) {
  item.balance = calculateBalance(item, prevDate, item.rate, balance) + item.amount;
  return item.balance;
}

function calculatePayment(item, prevDate, balance) {
  item.balance = calculateBalance(item, prevDate, item.rate, balance) - item.amount;
  item.interestPaid = Math.min(item.amount, item.interest);
  item.principlePaid = item.amount - item.interest;
  return item.balance;
}

function calculateBalance(item, prevDate, rate, balance) {
  item.days = daysBetween(prevDate, item.date);
  item.interest = calculateInterest(item.date, item.days, rate, balance);
  item.balance = balance + item.interest;
  return item.balance;
}

function getRow(extendRow = false, date = null) {
  if(typeof getRow.rowCounter == 'undefined') {
    getRow.rowCounter = 0;
  }
  var row = document.createElement('div');
  if(!extendRow) {
    ++getRow.rowCounter;
  }
  if(getRow.rowCounter % 2) {
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

function addDays (date, daysToAdd) {
  var newDate = new Date(date);
  return newDate.setDate(date.getDate() + daysToAdd) && newDate;
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

function calculateInterestForDays(days, dailyRate, balance) {
  var interest = 0;
  if(dailyRate > 0 && balance > 0 && days > 0)
  {
    var newBalance = balance * Math.pow(1 + dailyRate, days);
    interest = newBalance - balance;
  }
  return interest;
}

function calculateDailyRate(date, rate) {
  return isLeapYear(date.getFullYear()) ? rate / 100 / 366 : rate / 100 / 365;
}

// This function now handles the edge case where you're calculating interest
// for a period where part of your calculation is in a leap year.
// This could probably be optimized a bit, but calculating it a year at a time
// works fine.
function calculateInterest(date, days, rate, balance) {
  var interest = 0;
  if(rate > 0 && balance > 0 && days > 0) {
    var prevDate = addDays(date, -days);
    var remainingDays = days;  
    var currentDate = prevDate;
    while(remainingDays > 0) {
      // This constructor is wonky. Year and day are one-based, but month is 0.
      var nextYear = new Date(currentDate.getFullYear() + 1, 0, 1);
      var currentDays = Math.min(remainingDays, daysBetween(currentDate, nextYear));
      // If the period straddles a year-end and there's no transaction after the
      // new year, currentDays will be zero. In that case, we'll jump.
      currentDays = Math.max(currentDays, 1);
      var dailyRate = isLeapYear(date.getFullYear()) ? rate / 100 / 366 : rate / 100 / 365;
      interest += calculateInterestForDays(currentDays, dailyRate, balance);
      balance += interest;

      remainingDays -= currentDays;
      currentDate = addDays(currentDate, currentDays);
    }
  }
  return interest;
}

function addInterestChargeRow(item, rate, ledgerElement) {
  // Build interest charge row.
  var chargeRow = getRow(false, item.date);
  chargeRow.appendChild(getCol('Accrued Interest at ' + +rate.toFixed(6) + '% (' + item.days + ' days)'));
  chargeRow.appendChild(getNumberCol(formatDollars(item.interest)));
  chargeRow.appendChild(getCol(''));
  ledgerElement.appendChild(chargeRow);
}

function addInterestChange(item, ledgerElement) {
  if(item.interest > 0) {
    addInterestChargeRow(item, item.oldRate, ledgerElement);
  }
  // Build interest change row.
  var changeRow = getRow(true);
  changeRow.appendChild(getCol('New Interest Rate (' + +item.rate.toFixed(6) + '%)'));
  changeRow.appendChild(getCol(''));
  changeRow.appendChild(getNumberCol(formatDollars(item.balance)));
  ledgerElement.appendChild(changeRow);
}

function addAdvance(item, ledgerElement) {
  if(item.interest > 0) {
    addInterestChargeRow(item, item.rate, ledgerElement);
  }
  var advanceRow = getRow(true);
  advanceRow.appendChild(getCol('Loan Advance'));
  advanceRow.appendChild(getNumberCol(formatDollars(item.amount)));
  advanceRow.appendChild(getNumberCol(formatDollars(item.balance)));
  ledgerElement.appendChild(advanceRow);
}

function addPayment(item, ledgerElement) {
  if(item.interest > 0) {
    addInterestChargeRow(item, item.rate, ledgerElement);
  }

  var totalRow = getRow(true);
  totalRow.appendChild(getCol('Payment (Total)'));
  totalRow.appendChild(getNumberCol(formatDollars(item.amount)));
  totalRow.appendChild(getCol(''));
  ledgerElement.appendChild(totalRow);
  
  var intRow = getRow(true);
  intRow.appendChild(getCol('Payment (Interest)'));
  intRow.appendChild(getNumberCol(formatDollars(item.interestPaid)));
  if(item.amount === item.interest) {
    intRow.appendChild(getNumberCol(formatDollars(item.balance)));
    ledgerElement.appendChild(intRow);
  } else {
    intRow.appendChild(getCol(''));
    ledgerElement.appendChild(intRow);

    var effectRow = getRow(true);
    if(item.principlePaid > 0) {
      effectRow.appendChild(getCol('Payment (Principle)'));
      effectRow.appendChild(getNumberCol(formatDollars(item.principlePaid)));  
    } else {
      effectRow.appendChild(getCol('Remaining Interest Applied to Balance'));
      effectRow.appendChild(getNumberCol(formatDollars(-item.principlePaid)));
    }
    effectRow.appendChild(getNumberCol(formatDollars(item.balance)));
    ledgerElement.appendChild(effectRow);
  }  
}

function addTerminator(item, ledgerElement) {
  var balanceRow = getRow(false, item.date);
  balanceRow.appendChild(getCol('Current Balance'));
  balanceRow.appendChild(getCol(''));
  balanceRow.appendChild(getNumberCol(formatDollars(item.balance)));
  ledgerElement.appendChild(balanceRow);
}

function displayLedger(ledger) {
  var ledgerElement = document.getElementById('ledger');

  // Insert the origination row.
  var row = getRow(false, ledger[0].date);
  row.appendChild(getCol('Loan Origination'));
  row.appendChild(getCol(''));
  row.appendChild(getCol(''));
  ledgerElement.appendChild(row);

  // Iterate through the ledger.
  for(var i = 0; i < ledger.length; ++i) {
    var item = ledger[i];
    switch(item.type) {
      case 'rateChange':
        addInterestChange(item, ledgerElement);
        break;
      case 'advance':
        addAdvance(item, ledgerElement);
        break;
      case 'payment':
        addPayment(item, ledgerElement);
        break;
      case 'terminator':
        if(item.interest > 0) {
          addInterestChargeRow(item, item.rate, ledgerElement);
        }
        addTerminator(item, document.getElementById('balance'));
        break;
    }
  }
}

function process() {
  ledger = initData();
  displayLedger(ledger);
}
