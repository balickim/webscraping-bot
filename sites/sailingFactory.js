const url = "https://sailingfactory.pl/rejsy-morskie";

const cheerio = require("cheerio");
const fetch = require("node-fetch");
const Website = require("../models/websites");

class sailingFactory {
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
    $("div[class='cruise-col']")
      .children("div[class='cruise-entry']")
      .each(function (i, el) {
        found.push({
          title: $(el).children("h3").text(),
          link: $(el).children("a").attr("href"),
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
              title: el.title,
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

module.exports = sailingFactory;
