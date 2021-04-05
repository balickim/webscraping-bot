const url = "https://www.kubryk.pl";

const subPages = [
  "https://www.kubryk.pl/rejsy/baltyk",
  "https://www.kubryk.pl/rejsy/morze-polnocne",
  "https://www.kubryk.pl/rejsy/grecja",
];

const cheerio = require("cheerio");
const fetch = require("node-fetch");
const Website = require("../models/websites");

class kubryk {
  static get() {
    return Promise.all(
      subPages.map((urls) =>
        fetch(urls)
          .then((res) => res.text())
          .then((html) => {
            return this.loadAndFind(html, urls);
          })
          .catch((err) => {
            console.log(err);
          })
      )
    );
  }

  static loadAndFind = (html, urls) => {
    const $ = cheerio.load(html);
    let found = [];
    $("section[class='results']")
      .children("div[class='container']")
      .children("div[class='row']")
      .children("div[id='results']")
      .children("a")
      .each(function (i, el) {
        found.push({
          route: $(el)
            .children("div")
            .children("div[class='custom-col-4 route']")
            .children("p[class='route-list']")
            .text()
            .trim(),
          dateRange: $(el)
            .children("div")
            .children("div[class='custom-col-2']")
            .children("p")
            .text()
            .replace(/\s+/g, "")
            .trim(),
          price: $(el)
            .children("div")
            .children("div[class='custom-col-3']")
            .last()
            .children("p")
            .children("b")
            .text()
            .slice(0, -4),
          freeSits: $(el)
            .children("div")
            .children("div[class='custom-col-5']")
            .children("span")
            .children("b")
            .text(),
          area: urls.substring(urls.lastIndexOf("/") + 1),
          link: url + $(el).attr("href"),
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
            el.forEach((value) => {
              let website = new Website({
                route: value.route,
                dateRange: value.dateRange,
                price: parseInt(value.price),
                freeSits: parseInt(value.freeSits),
                link: value.link,
                area: value.area,
                siteUrl: url,
              });
              website.save(data);
            });
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

module.exports = kubryk;
