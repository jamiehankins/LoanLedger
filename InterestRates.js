var initialRate = 5.25;
var rates = [
{ "date": "12/17/2016", "rate": 5.50 },
{ "date": "7/27/2016", "rate": 5.25 },
{ "date": "3/18/2017", "rate": 5.75 },
{ "date": "6/17/2017", "rate": 6.00 },
{ "date": "12/16/2017", "rate": 6.25 },
{ "date": "3/24/2018", "rate": 6.50 },
{ "date": "4/26/2018", "rate": 5.375 },
{ "date": "5/3/2018", "rate": 4.875 },
{ "date": "6/16/2018", "rate": 5.125 },
{ "date": "9/29/2018", "rate": 5.375 },
{ "date": "12/22/2018", "rate": 5.625 },
{ "date": "8/3/2019", "rate": 5.375 },
{ "date": "9/21/2019", "rate": 5.125 },
{ "date": "11/2/2019", "rate": 4.875 },
{ "date": "3/6/2020", "rate": 4.375 },
{ "date": "3/18/2020", "rate": 3.375 },
{ "date": "3/17/2022", "rate": 3.625 },
{ "date": "5/5/2022", "rate": 4.125 },
];
// The FDIC prime lending rate has been 3.25% since March 2020.
// The history can be had from here:
// https://www.jpmorganchase.com/about/our-business/historical-prime-rate
// I pay prime plus .125%.
// Maybe later, I'll add the ability to set the "prime plus" variable and have
// it query a data source.