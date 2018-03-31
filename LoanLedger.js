var ledger = [];
function initData() {
  // Add all rate settings to ledger.
  for(i = 0; i < rates.length; ++i) {
    var item = [];
    item.date = rates[i].date;
    item.rate = rates[i].rate;
    item.amount = null;
    ledger.push(item);
  }
  // Add all payments to ledger.
  for(i = 0; i < payments.length; ++i) {
    var item = [];
    item.date = payments[i].date;
    item.rate = null;
    item.amount = payments[i].amount;
    ledger.push(item);
  }
  // Sort the ledger by date, and put
  // rate changes before payments.
  ledger.sort(function(a, b) {
    var ret = 0;
    var aDate = fDate(a.date);
    var bDate = fDate(b.date);
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
  // Now, calculate the running balance.
  var balance = initialBalance;
  var prevItem = ledger[0];
  prevItem.balance = initialBalance;
  for(i = 1; i < ledger.length; ++i) {
    var thisItem = ledger[i];
    // Do nothing for the last item placeholder.
    if(thisItem.date == '12/31/2099')
    {
      break;
    }

  }  
}

function fDate(s) {
  var d = new Date();
  s = s.split('/');
  d.setFullYear(s[2], s[0] - 1, s[1]);
  return d;
}

function isLeapYear(year)
{
    return (year & 3) == 0 && ((year % 25) != 0 || (year & 15) == 0);
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

function show() {
  var ledgerElement = document.getElementById('ledger');
  for(var i = 0; i < ledger.length - 1; ++i) {
    var date = ledger[i].date;
    var rate = ledger[i].rate != null ? ledger[i].rate : '';
    var amount = ledger[i].amount != null ? ledger[i].amount : '';
    ledgerElement.appendChild(buildRow(date, rate, amount));
  }
}
