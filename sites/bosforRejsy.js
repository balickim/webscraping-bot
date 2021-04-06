const url = "https://www.bosforrejsy.pl/katalog,rejsow";

const cheerio = require("cheerio");
const fetch = require("node-fetch");
const Website = require("../models/websites");

class bosforRejsy {
  static get() {
    return fetch(url)
      .then((res) => res.text())
      .then((html) => {
        return this.loadAndFind(html);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  static loadAndFind = (html) => {
    const $ = cheerio.load(html);
    let found = [];
    $("div[class='col-lg-9 col-md-12 col-sm-12 col-xs-12']").each(function (
      i,
      el
    ) {
      found.push({
        title: $(el).children("h4").text(),
        dateRange: $(el)
          .children("div")
          .last()
          .children("div[class='row']")
          .children("div[class='col-lg-6 col-md-6 col-sm-12 col-xs-12']")
          .children("p")
          .children("strong")
          .text(),
        route: $(el)
          .children("div")
          .last()
          .children("div[class='row']")
          .children("div[class='col-lg-6 col-md-6 col-sm-12 col-xs-12']")
          .eq(1)
          .children("p")
          .text(),
        price: $(el)
          .children("div")
          .last()
          .children("div[class='row']")
          .last()
          .children("div")
          .children("span")
          .text()
          .replace(/\s/g, ""),
        freeSits: $(el)
          .children("div")
          .last()
          .children("div[class='row']")
          .eq(2)
          .children("div")
          .children("span")
          .children("strong")
          .text(),
        link: url,
      });
    });
    return found;
  };

  static saveToDb() {
    this.get().then((data) => {
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
            new Date().toISOString() +
              " - " +
              "Inserting new data" +
              " - " +
              url
          );

          data.forEach(function (el, i) {
            let website = new Website({
              title: el.title.trim(),
              dateRange: el.dateRange,
              route: el.route,
              price: el.price.match(/\d+/) ? el.price.match(/\d+/)[0] : -1,
              currency: el.price.includes("PLN") ? "pln" : "eur",
              freeSits: el.freeSits,
              link: el.link,
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
  }
}

module.exports = bosforRejsy;
