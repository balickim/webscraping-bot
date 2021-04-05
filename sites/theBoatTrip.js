const url = "https://www.theboattrip.eu/rejsy-morskie";

const cheerio = require("cheerio");
const Website = require("../models/websites");
const puppeteer = require("puppeteer");

async function get(resp) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);

  resp(await page.content());
  browser.close();
}

loadAndFind = (html) => {
  const $ = cheerio.load(html);
  let found = [];
  $("div[class='photoContainer']").each(function (i, el) {
    found.push({
      title: $(el)
        .children("div[class='tripInfo']")
        .children("h3")
        .children("a")
        .text(),
      link: url + $(el).children("a").attr("href"),
      dateRange: $(el)
        .children("div[class='tripInfo']")
        .children("div[class='infoTripBox']")
        .children()
        .last()
        .text()
        .trim(),
      price: $(el)
        .children("div[class='priceSection']")
        .children("div[class='priceBox']")
        .children("div[class='regularPrice']")
        .children()
        .text()
        .trim(),
    });
  });
  return found;
};

exports.saveToDb = () => {
  get((data) => {
    data = loadAndFind(data);
    if (data && data.length !== 0) {
      Website.deleteMany({ siteUrl: url }, function (err) {
        if (err) console.log(err);
        console.log(
          new Date().toISOString() +
            " - " +
            "Successful deletion of old data" +
            " - " +
            url
        );
      }).then(() => {
        console.log(
          new Date().toISOString() + " - " + "Inserting new data" + " - " + url
        );

        data.forEach(function (el, i) {
          let website = new Website({
            title: el.title,
            link: el.link,
            price: el.price.match(/\d+/) ? el.price.match(/\d+/)[0] : -1,
            currency: el.price.includes("pln") ? "pln" : "eur",
            dateRange: el.dateRange,
            siteUrl: url,
          });
          website.save(data);
        });
      });
    } else {
      console.error(
        new Date().toISOString() +
          " - " +
          "Problem with the website - no data" +
          " - " +
          url
      );
    }
  });
};
