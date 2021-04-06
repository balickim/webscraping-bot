const url = "https://sztormgrupa.pl";

const cheerio = require("cheerio");
const Website = require("../models/websites");
const puppeteer = require("puppeteer");

const subPages = [
  "https://sztormgrupa.pl/index.php/kursy/zeglarskie/zeglarz-jachtowy-sternik-motorowodny-mazury",
  "https://sztormgrupa.pl/index.php/kursy/zeglarskie/rejsy-doszkalajace-mazury",
  "https://sztormgrupa.pl/index.php/kursy/zeglarskie/indywidualny-kurs-zeglarski-na-mazurach",
  "https://sztormgrupa.pl/index.php/rejsy/baltyk/caravela-sztorm-1000-baltyk",
  "https://sztormgrupa.pl/index.php/rejsy/baltyk/listopadowe-harpagany-na-pogorii",
  "https://sztormgrupa.pl/index.php/rejsy/baltyk/sztorm-na-fryderyku-chopinie",
  "https://sztormgrupa.pl/index.php/rejsy/baltyk/listopadowe-harpagany-na-zawiszy-czarnym",
  "https://sztormgrupa.pl/index.php/rejsy/chorwacja/chorwacja-kick-off",
  "https://sztormgrupa.pl/index.php/rejsy/chorwacja/chorwacja-leaving-hvar",
];

module.exports.main = async function main() {
  const browser = await puppeteer.launch();

  return Promise.all(
    subPages.map(async (urls) => {
      const page = await browser.newPage();
      await page
        .goto(urls)
        .then(() => {
          return (html = page.content());
        })
        .then((html) => {
          this.saveToDb(loadAndFind(html, urls));
        })
        .catch((err) => {
          console.log(err);
        });
    })
  ).then(() => {
    browser.close();
  });
};

loadAndFind = (html, urls) => {
  const $ = cheerio.load(html);
  let found = [];
  $(
    "table[class='table table-bordered table-responsive table-hover'] > tbody > tr"
  ).each((i, el) => {
    if (i !== 0) {
      let area;
      if (urls.includes("baltyk")) {
        area = "bałtyk";
      } else if (urls.includes("chorwacja")) {
        area = "chorwacja";
      } else {
        area = "mazury";
      }

      found.push({
        dateRange: $(el).children("td").eq(1).text().trim(),
        info: $(el).children("td").eq(2).text().trim(),
        freeSits: $(el).children("td").eq(3).text().trim(),
        price: $(el).children("td").eq(4).text().trim(),
        area: area,
        link: urls,
      });
    }
  });
  return found;
};

exports.saveToDb = (data) => {
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
          info: el.info,
          link: el.link,
          area: el.area,
          price: el.price.match(/\d+/) ? el.price.match(/\d+/)[0] : -1,
          currency: el.price.includes("PLN") ? "pln" : "eur",
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
};
