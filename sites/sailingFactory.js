const url = "https://sailingfactory.pl/rejsy-morskie";

const cheerio = require("cheerio");
const fetch = require("node-fetch");
const Website = require("../models/websites");
const SHA256 = require("crypto-js/sha256");

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
      let now = new Date().toISOString();
      console.log(now + " - " + url);
      data.forEach(function (el, i) {
        let website = new Website({
          index: SHA256(el.title + el.link + url).toString(),
          title: el.title,
          link: el.link,
          siteUrl: url,
        });
        // website.save(data);
        website.update(data, { upsert: true });
      });
    });
  }
}

module.exports = sailingFactory;
