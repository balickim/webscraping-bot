const url = "https://www.morskierejsy.pl";

const cheerio = require("cheerio");
const fetch = require("node-fetch");
const Website = require("../models/websites");

class morskieRejsy {
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
    $("div[class='box_startowy']").each(function (i, el) {
      let dateRangeIndex = $(el)
        .children("div[class='text']")
        .children("p")
        .children("span")
        .children("span")
        .text()
        .lastIndexOf("TERMIN:");

      let priceIndex = $(el)
        .children("div[class='text']")
        .children("p")
        .children("span")
        .children("span")
        .text()
        .lastIndexOf("CENA:");

      let yachtIndex = $(el)
        .children("div[class='text']")
        .children("p")
        .children("span")
        .children("span")
        .text()
        .lastIndexOf("JACHT:");

      let routeIndex = $(el)
        .children("div[class='text']")
        .children("p")
        .children("span")
        .children("span")
        .text()
        .lastIndexOf("TRASA:");
      found.push({
        title: $(el).children("div[class='tytul']").children("a").text(),
        link:
          url +
          "/" +
          $(el).children("div[class='tytul']").children("a").attr("href"),
        dateRange: $(el)
          .children("div[class='text']")
          .children("p")
          .children("span")
          .children("span")
          .text()
          .substring(dateRangeIndex + 8, -2 + priceIndex),
        price: $(el)
          .children("div[class='text']")
          .children("p")
          .children("span")
          .children("span")
          .text()
          .substring(priceIndex, yachtIndex),
        route: $(el)
          .children("div[class='text']")
          .children("p")
          .children("span")
          .children("span")
          .text()
          .substring(routeIndex + 7, dateRangeIndex)
          .trim(),
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
              link: el.link,
              route: el.route,
              dateRange: el.dateRange,
              price: el.price.match(/\d+/) ? el.price.match(/\d+/)[0] : -1,
              currency: el.price.includes("pln") ? "pln" : "eur",
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

module.exports = morskieRejsy;
