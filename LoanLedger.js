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
    if(aDate != bDate) {
      ret = aDate < bDate ? -1 : 1;
    } else {
      if(a.rate != null && b.rate == null) {
        ret = -1;
      } else if(a.rate == null && b.rate != null) {
        ret = 1;
      }
    }
    return ret;
  });
}

function parseDate(s) {
  var d = new Date();
  s = s.split('/');
  d.setFullYear(s[2], s[0] - 1, s[1]);
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
  return date.getMonth() + '/' + date.getDate() + '/' + date.getFullYear();
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

function buildRow(date, rate, amount) {
  var row = document.createElement('div');
  row.className = 'divTableRow';
  var dateCol = getCol(date);
  if(rate != '') {
    rate += '%';
  }
  var rateCol = getCol(rate);
  if(amount != '') {
    amount = '$' + amount;
  }
  var amCol = getCol(amount);
  row.appendChild(dateCol);
  row.appendChild(rateCol);
  row.appendChild(amCol);
  return row;
}

function chargeInterest(date, days, balance, rate) {
  // Build interest charge row.
  var chargeRow = document.createElement('div');
  chargeRow.className = 'divTableRow';
  var dailyRate = isLeapYear(date.getFullYear()) ? rate / 100 / 366 : rate / 100 / 365;
  var newBalance = balance * Math.pow(1 + dailyRate, days);
  var interest = newBalance - balance;
  chargeRow.appendChild(getCol(formatDate(date)));
  chargeRow.appendChild(getCol('Interest (' + days + ' days)'));
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

function applyPayment(date, amount, balance) {
  balance -= amount;
  // Build payment row.
  var paymentRow = document.createElement('div');
  paymentRow.className = 'divTableRow';
  paymentRow.appendChild(getCol(formatDate(date)));
  paymentRow.appendChild(getCol('Payment'));
  paymentRow.appendChild(getCol(formatDollars(amount)));
  paymentRow.appendChild(getCol(formatDollars(balance)));

  // Get ledger and add payment row.
  var ledgerElement = document.getElementById('ledger');
  ledgerElement.appendChild(paymentRow);

  return balance;
}


function getIt() {
  var rate = initialRate;
  var prevDate = parseDate("7/27/2016");
  var balance = initialBalance;

  for(var i = 0; i < ledger.length; ++i) {
    var item = ledger[i];
    if(item.date >= parseDate("1/1/2099")) {
      break;
    }
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
      balance = chargeInterest(newDate, days, balance, rate);
      balance = applyPayment(newDate, item.amount, balance);
      prevDate = newDate;
    }
  }
}

function show() {
  var ledgerElement = document.getElementById('ledger');
  for(var i = 0; i < ledger.length - 1; ++i) {
    var date = ledger[i].date;
    var rate = ledger[i].rate != null ? ledger[i].rate : '';
    var amount = ledger[i].amount != null ? ledger[i].amount : '';
    ledgerElement.appendChild(buildRow(date, rate, amount));
  }
}
